# This goes in backend/App/Api/endpoints/samsara.py
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks, status
from sqlalchemy.orm import Session
from typing import List, Dict, Any, Optional
import httpx
import os
import logging
from datetime import datetime, timedelta

from App import models
from App import schemas
from App.database_module import get_db
from auth import get_current_active_user, check_manager

# Get API key from environment variable
SAMSARA_API_KEY = os.getenv("SAMSARA_API_KEY")
# If not set in environment, log a warning
if not SAMSARA_API_KEY:
    logging.warning("SAMSARA_API_KEY environment variable not set. Samsara integration will not work.")
SAMSARA_API_BASE_URL = "https://api.samsara.com"

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/api/samsara",
    tags=["samsara"],
    dependencies=[Depends(get_current_active_user)],
)

async def fetch_samsara_vehicles():
    """
    Fetch vehicles from Samsara API.
    """
    if not SAMSARA_API_KEY:
        logger.error("Samsara API key not configured")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Samsara API key not configured"
        )
    
    headers = {
        "Authorization": f"Bearer {SAMSARA_API_KEY}"
    }
    
    logger.info("Fetching vehicles from Samsara API")
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{SAMSARA_API_BASE_URL}/fleet/vehicles",
                headers=headers
            )
            
            if response.status_code != 200:
                logger.error(f"Error from Samsara API: {response.text}")
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail=f"Error from Samsara API: {response.text}"
                )
            
            # Log the raw response for debugging
            response_data = response.json()
            logger.info(f"Samsara API response: {response_data}")
            
            # Extract vehicles from the response
            vehicles = response_data.get("data", [])
            logger.info(f"Found {len(vehicles)} vehicles in Samsara API response")
            
            # Log each vehicle for debugging
            for i, vehicle in enumerate(vehicles):
                logger.info(f"Vehicle {i+1}: ID={vehicle.get('id')}, Name={vehicle.get('name')}")
            
            return vehicles
    except Exception as e:
        logger.error(f"Error fetching vehicles from Samsara: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching vehicles from Samsara: {str(e)}"
        )

async def fetch_vehicle_stats(vehicle_id: str, types: List[str] = None):
    """
    Fetch detailed vehicle statistics from Samsara API using the snapshot endpoint.
    
    Args:
        vehicle_id: The Samsara ID of the vehicle
        types: List of stat types to fetch (e.g., ["gps", "engineStates", "obdOdometerMeters"])
               If None, defaults to basic stats
    
    Returns:
        Vehicle stats data
    """
    if not SAMSARA_API_KEY:
        logger.error("Samsara API key not configured")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Samsara API key not configured"
        )
    
    headers = {
        "Authorization": f"Bearer {SAMSARA_API_KEY}"
    }
    
    # Default to basic stats if none provided
    if not types:
        types = ["engineStates", "obdOdometerMeters", "fuelPercents"]
    
    # Samsara API restricts to 3 types per request, so we need to batch them
    # Create batches of at most 3 types
    batches = []
    for i in range(0, len(types), 3):
        batches.append(types[i:i+3])
    
    logger.info(f"Fetching stats for vehicle {vehicle_id} with types {types} in {len(batches)} batches")
    
    # Combined results
    combined_stats = {}
    
    try:
        async with httpx.AsyncClient() as client:
            for batch_index, batch in enumerate(batches):
                # Ensure we have at most 3 types per batch
                if len(batch) > 3:
                    logger.warning(f"Batch {batch_index} has more than 3 types, truncating to first 3")
                    batch = batch[:3]
                
                params = {
                    "vehicles": vehicle_id,
                    "types": ",".join(batch)
                }
                
                logger.info(f"Fetching batch {batch_index + 1}/{len(batches)}: {batch} with params: {params}")
                
                try:
                    response = await client.get(
                        f"{SAMSARA_API_BASE_URL}/fleet/vehicles/stats",
                        headers=headers,
                        params=params
                    )
                    
                    if response.status_code != 200:
                        logger.error(f"Error from Samsara API for batch {batch_index + 1}: {response.text}")
                        logger.error(f"Request params: {params}")
                        # Continue with other batches instead of failing completely
                        continue
                    
                    # Extract data from response
                    response_json = response.json()
                    logger.debug(f"Response for batch {batch_index + 1}: {response_json}")
                    
                    if "data" in response_json and len(response_json["data"]) > 0:
                        batch_data = response_json["data"][0]
                        # Merge with combined results
                        combined_stats.update(batch_data)
                    else:
                        logger.warning(f"No data in response for batch {batch_index + 1}")
                
                except Exception as batch_error:
                    logger.error(f"Error processing batch {batch_index + 1}: {str(batch_error)}")
                    # Continue with other batches instead of failing completely
                    continue
            
            # If we didn't get any data at all, that's a problem
            if not combined_stats:
                logger.error("No vehicle stats data retrieved from any batch")
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="Failed to retrieve any vehicle stats data"
                )
            
            return combined_stats
    except HTTPException as he:
        # Re-raise HTTP exceptions
        raise he
    except Exception as e:
        logger.error(f"Error fetching vehicle stats: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, 
            detail=f"Error fetching vehicle stats: {str(e)}"
        )

async def fetch_vehicle_stats_feed(vehicle_ids: List[str], types: List[str] = None):
    """
    Fetch vehicle statistics from Samsara API using the feed endpoint.
    This endpoint is better for continuous synchronization as it's less susceptible to missing data.
    
    Args:
        vehicle_ids: List of Samsara vehicle IDs
        types: List of stat types to fetch (e.g., ["gps", "engineStates", "obdOdometerMeters"])
               If None, defaults to basic stats
    
    Returns:
        Vehicle stats data for all requested vehicles
    """
    if not SAMSARA_API_KEY:
        logger.error("Samsara API key not configured")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Samsara API key not configured"
        )
    
    headers = {
        "Authorization": f"Bearer {SAMSARA_API_KEY}"
    }
    
    # Default to basic stats if none provided
    if not types:
        types = ["engineStates", "obdOdometerMeters", "fuelPercents"]
    
    # Samsara API restricts to 3 types per request, so we need to batch them
    # Create batches of at most 3 types
    batches = []
    for i in range(0, len(types), 3):
        batches.append(types[i:i+3])
    
    logger.info(f"Fetching stats feed for {len(vehicle_ids)} vehicles with types {types} in {len(batches)} batches")
    
    # Combined results
    all_vehicle_stats = []
    
    try:
        async with httpx.AsyncClient() as client:
            for batch in batches:
                params = {
                    "vehicles": ",".join(vehicle_ids),
                    "types": ",".join(batch)
                }
                
                logger.info(f"Fetching feed batch: {batch}")
                response = await client.get(
                    f"{SAMSARA_API_BASE_URL}/fleet/vehicles/stats/feed",
                    headers=headers,
                    params=params
                )
                
                if response.status_code != 200:
                    logger.error(f"Error from Samsara API: {response.text}")
                    raise HTTPException(
                        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                        detail=f"Error from Samsara API: {response.text}"
                    )
                
                # Extract data from response
                batch_data = response.json().get("data", [])
                
                # For the first batch, initialize the result with the vehicle data
                if not all_vehicle_stats:
                    all_vehicle_stats = batch_data
                else:
                    # For subsequent batches, merge the stats into the existing vehicle data
                    for i, vehicle_stats in enumerate(batch_data):
                        if i < len(all_vehicle_stats):  # Make sure we have a matching vehicle
                            # Merge the stats from this batch into the existing stats
                            all_vehicle_stats[i].update(vehicle_stats)
            
            return all_vehicle_stats
    except Exception as e:
        logger.error(f"Error fetching vehicle stats feed: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, 
            detail=f"Error fetching vehicle stats feed: {str(e)}"
        )

async def fetch_vehicle_stats_history(
    vehicle_ids: List[str], 
    start_time: datetime, 
    end_time: datetime, 
    types: List[str] = None
):
    """
    Fetch historical vehicle statistics from Samsara API.
    This endpoint is suited for back-filling historical data or ad-hoc queries.
    
    Args:
        vehicle_ids: List of Samsara vehicle IDs
        start_time: Start time for the historical data
        end_time: End time for the historical data
        types: List of stat types to fetch (e.g., ["gps", "engineStates", "obdOdometerMeters"])
               If None, defaults to basic stats
    
    Returns:
        Historical vehicle stats data for all requested vehicles
    """
    if not SAMSARA_API_KEY:
        logger.error("Samsara API key not configured")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Samsara API key not configured"
        )
    
    headers = {
        "Authorization": f"Bearer {SAMSARA_API_KEY}"
    }
    
    # Default to basic stats if none provided
    if not types:
        types = ["engineStates", "obdOdometerMeters", "fuelPercents"]
    
    # Format times in ISO 8601 format
    start_time_str = start_time.strftime("%Y-%m-%dT%H:%M:%SZ")
    end_time_str = end_time.strftime("%Y-%m-%dT%H:%M:%SZ")
    
    # Samsara API restricts to 3 types per request, so we need to batch them
    # Create batches of at most 3 types
    batches = []
    for i in range(0, len(types), 3):
        batches.append(types[i:i+3])
    
    logger.info(f"Fetching historical stats for {len(vehicle_ids)} vehicles from {start_time_str} to {end_time_str} in {len(batches)} batches")
    
    # Combined results
    all_vehicle_stats = []
    
    try:
        async with httpx.AsyncClient() as client:
            for batch in batches:
                params = {
                    "vehicles": ",".join(vehicle_ids),
                    "types": ",".join(batch),
                    "startTime": start_time_str,
                    "endTime": end_time_str
                }
                
                logger.info(f"Fetching history batch: {batch}")
                response = await client.get(
                    f"{SAMSARA_API_BASE_URL}/fleet/vehicles/stats/history",
                    headers=headers,
                    params=params
                )
                
                if response.status_code != 200:
                    logger.error(f"Error from Samsara API: {response.text}")
                    raise HTTPException(
                        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                        detail=f"Error from Samsara API: {response.text}"
                    )
                
                # Extract data from response
                batch_data = response.json().get("data", [])
                
                # For the first batch, initialize the result with the vehicle data
                if not all_vehicle_stats:
                    all_vehicle_stats = batch_data
                else:
                    # For subsequent batches, merge the stats into the existing vehicle data
                    for i, vehicle_stats in enumerate(batch_data):
                        if i < len(all_vehicle_stats):  # Make sure we have a matching vehicle
                            # Merge the stats from this batch into the existing stats
                            all_vehicle_stats[i].update(vehicle_stats)
            
            return all_vehicle_stats
    except Exception as e:
        logger.error(f"Error fetching vehicle stats history: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, 
            detail=f"Error fetching vehicle stats history: {str(e)}"
        )

async def fetch_diagnostic_codes(vehicle_id: str):
    """
    Fetch diagnostic codes for a vehicle from Samsara API.
    This function tries multiple endpoints to get diagnostic codes:
    1. First, it tries to get fault codes from the vehicle stats endpoint
    2. Then, it tries to get defects from the DVIRs endpoint
    """
    if not SAMSARA_API_KEY:
        logger.error("Samsara API key not configured")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Samsara API key not configured"
        )
    
    headers = {
        "Authorization": f"Bearer {SAMSARA_API_KEY}"
    }
    
    logger.info(f"Fetching diagnostic codes for vehicle {vehicle_id}")
    
    # Combined results
    all_codes = []
    
    try:
        # First, try to get fault codes from the vehicle stats endpoint
        async with httpx.AsyncClient() as client:
            # Request fault codes specifically
            response = await client.get(
                f"{SAMSARA_API_BASE_URL}/fleet/vehicles/stats",
                headers=headers,
                params={
                    "vehicles": vehicle_id,
                    "types": "faultCodes"
                }
            )
            
            if response.status_code == 200:
                data = response.json()
                logger.info(f"Vehicle stats response: {data}")
                
                # Extract fault codes from the response
                if "data" in data and len(data["data"]) > 0:
                    vehicle_data = data["data"][0]
                    if "faultCodes" in vehicle_data:
                        fault_codes = vehicle_data["faultCodes"]
                        logger.info(f"Found {len(fault_codes)} fault codes in vehicle stats")
                        
                        # Convert fault codes to diagnostic codes format
                        for code in fault_codes:
                            # Add type checking to handle different data formats
                            if isinstance(code, dict):
                                all_codes.append({
                                    "type": "fault_code",
                                    "code": code.get("code", "Unknown"),
                                    "description": code.get("description", ""),
                                    "severity": code.get("severity", "Medium"),
                                    "reported_date": datetime.now().isoformat()
                                })
                            elif isinstance(code, str):
                                # Handle case where code is a string
                                all_codes.append({
                                    "type": "fault_code",
                                    "code": code,
                                    "description": "No description available",
                                    "severity": "Medium",
                                    "reported_date": datetime.now().isoformat()
                                })
                            else:
                                logger.warning(f"Unexpected fault code format: {code}")
            else:
                logger.warning(f"Failed to get fault codes from vehicle stats: {response.text}")
        
        # Then, try to get defects from the DVIRs endpoint
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{SAMSARA_API_BASE_URL}/fleet/maintenance/dvirs",
                headers=headers,
                params={"vehicleId": vehicle_id}
            )
            
            if response.status_code == 200:
                dvirs = response.json().get("dvirs", [])
                logger.info(f"Found {len(dvirs)} DVIRs")
                
                # Extract defects from DVIRs
                for dvir in dvirs:
                    if "defects" in dvir:
                        for defect in dvir["defects"]:
                            # Convert defect to diagnostic code format
                            all_codes.append({
                                "type": "dvir_defect",
                                "code": defect.get("defectCode", "Unknown"),
                                "description": defect.get("comment", ""),
                                "severity": "Medium",  # Default severity
                                "reported_date": datetime.fromtimestamp(
                                    dvir.get("inspectionTimeMs", 0) / 1000
                                ).isoformat() if dvir.get("inspectionTimeMs") else datetime.now().isoformat()
                            })
            else:
                logger.warning(f"Failed to get DVIRs: {response.text}")
        
        logger.info(f"Total diagnostic codes found: {len(all_codes)}")
        return all_codes
    except Exception as e:
        logger.error(f"Error fetching diagnostic codes: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching diagnostic codes: {str(e)}"
        )

@router.get("/vehicles", summary="Get vehicles from Samsara")
async def get_samsara_vehicles(
    current_user: models.User = Depends(get_current_active_user)
):
    """
    Get all vehicles from Samsara API.
    """
    try:
        vehicles = await fetch_samsara_vehicles()
        return {"vehicles": vehicles}
    except HTTPException as e:
        raise e
    except Exception as e:
        logger.error(f"Error in get_samsara_vehicles: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

@router.post("/sync", summary="Sync vehicles from Samsara")
async def sync_samsara_vehicles(
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(check_manager)
):
    """
    Sync all vehicles from Samsara to the local database (requires manager role).
    This is an asynchronous operation that runs in the background.
    """
    # Add sync task to background tasks
    background_tasks.add_task(
        background_sync_samsara,
        db=db,
        created_by=current_user.user_id
    )
    
    return {
        "message": "Samsara sync started in the background",
        "status": "processing"
    }

@router.get("/vehicle/{vehicle_id}/stats", summary="Get current vehicle stats from Samsara")
async def get_vehicle_stats(
    vehicle_id: str,
    types: str = None,
    current_user: models.User = Depends(get_current_active_user)
):
    """
    Get current statistics for a specific vehicle from Samsara using the snapshot endpoint.
    
    Args:
        vehicle_id: The Samsara ID of the vehicle
        types: Comma-separated list of stat types to fetch (e.g., "gps,engineStates,obdOdometerMeters")
              If not provided, defaults to basic stats
              
    Note:
        Samsara API restricts to 3 types per request, but this endpoint handles batching
        automatically. You can request more than 3 types, and they will be fetched in batches.
    """
    try:
        # Convert comma-separated string to list if provided
        type_list = types.split(",") if types else None
        
        # Log the requested types
        if type_list:
            logger.info(f"Requesting stats for vehicle {vehicle_id} with types: {type_list}")
            if len(type_list) > 3:
                logger.info(f"More than 3 types requested ({len(type_list)}). Will batch requests.")
        
        stats = await fetch_vehicle_stats(vehicle_id, type_list)
        return stats
    except HTTPException as he:
        # Re-raise HTTP exceptions
        raise he
    except Exception as e:
        logger.error(f"Error fetching vehicle stats: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching vehicle stats from Samsara: {str(e)}"
        )

@router.get("/vehicles/stats/feed", summary="Get vehicle stats feed from Samsara")
async def get_vehicle_stats_feed(
    vehicles: str,
    types: str = None,
    current_user: models.User = Depends(get_current_active_user)
):
    """
    Get statistics for multiple vehicles from Samsara using the feed endpoint.
    This endpoint is better for continuous synchronization.
    
    Args:
        vehicles: Comma-separated list of Samsara vehicle IDs
        types: Comma-separated list of stat types to fetch (e.g., "gps,engineStates,obdOdometerMeters")
              If not provided, defaults to basic stats
    """
    try:
        # Convert comma-separated strings to lists
        vehicle_ids = vehicles.split(",")
        type_list = types.split(",") if types else None
        
        stats = await fetch_vehicle_stats_feed(vehicle_ids, type_list)
        return {"data": stats}
    except Exception as e:
        logger.error(f"Error fetching vehicle stats feed: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching vehicle stats feed from Samsara: {str(e)}"
        )

@router.get("/vehicles/stats/history", summary="Get historical vehicle stats from Samsara")
async def get_vehicle_stats_history(
    vehicles: str,
    start_time: str,
    end_time: str,
    types: str = None,
    current_user: models.User = Depends(get_current_active_user)
):
    """
    Get historical statistics for multiple vehicles from Samsara.
    This endpoint is suited for back-filling historical data or ad-hoc queries.
    
    Args:
        vehicles: Comma-separated list of Samsara vehicle IDs
        start_time: Start time for the historical data (ISO 8601 format, e.g., "2023-01-01T00:00:00Z")
        end_time: End time for the historical data (ISO 8601 format, e.g., "2023-01-02T00:00:00Z")
        types: Comma-separated list of stat types to fetch (e.g., "gps,engineStates,obdOdometerMeters")
              If not provided, defaults to basic stats
    """
    try:
        # Convert comma-separated strings to lists and parse dates
        vehicle_ids = vehicles.split(",")
        type_list = types.split(",") if types else None
        
        # Parse ISO 8601 datetime strings
        start_datetime = datetime.fromisoformat(start_time.replace('Z', '+00:00'))
        end_datetime = datetime.fromisoformat(end_time.replace('Z', '+00:00'))
        
        stats = await fetch_vehicle_stats_history(vehicle_ids, start_datetime, end_datetime, type_list)
        return {"data": stats}
    except ValueError as e:
        logger.error(f"Invalid datetime format: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid datetime format. Please use ISO 8601 format (e.g., '2023-01-01T00:00:00Z')"
        )
    except Exception as e:
        logger.error(f"Error fetching vehicle stats history: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching vehicle stats history from Samsara: {str(e)}"
        )

@router.get("/vehicle/{vehicle_id}/diagnostic-codes", summary="Get diagnostic codes from Samsara")
async def get_diagnostic_codes(
    vehicle_id: str,
    current_user: models.User = Depends(get_current_active_user)
):
    """
    Get diagnostic trouble codes for a specific vehicle from Samsara.
    """
    try:
        codes = await fetch_diagnostic_codes(vehicle_id)
        return {"diagnostic_codes": codes}
    except Exception as e:
        logger.error(f"Error fetching diagnostic codes: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching diagnostic codes from Samsara: {str(e)}"
        )

@router.get("/sync/status", summary="Get Samsara sync status")
async def get_sync_status(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """
    Get the status of the most recent Samsara sync operation.
    """
    # Get latest sync log entries
    sync_logs = db.query(models.ActivityLog).filter(
        models.ActivityLog.action.in_(["CREATE", "UPDATE", "SYNC", "SYNC_COMPLETE", "ERROR"]),
        models.ActivityLog.entity_type.in_(["VEHICLE", "SYSTEM", "SAMSARA_MAINTENANCE"]),
        models.ActivityLog.details.like("%Samsara%")
    ).order_by(models.ActivityLog.created_at.desc()).limit(10).all()
    
    if not sync_logs:
        return {
            "status": "unknown",
            "message": "No sync operations found"
        }
    
    latest_sync = sync_logs[0]
    
    # Check for error in the latest sync
    if latest_sync.action == "ERROR":
        return {
            "status": "error",
            "message": latest_sync.details,
            "timestamp": latest_sync.created_at
        }
    
    # Calculate counts
    created_count = sum(1 for log in sync_logs if "Created vehicle from Samsara" in log.details)
    updated_count = sum(1 for log in sync_logs if "Updated vehicle from Samsara" in log.details)
    
    return {
        "status": "completed" if latest_sync.action == "SYNC_COMPLETE" else "in_progress",
        "latest_sync": latest_sync.created_at,
        "created": created_count,
        "updated": updated_count,
        "details": latest_sync.details
    }

@router.post("/sync/reset", summary="Reset Samsara sync status")
async def reset_sync_status(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(check_manager)
):
    """
    Reset the Samsara sync status if it gets stuck (requires manager role).
    """
    # Find the most recent in-progress sync log entry
    in_progress_log = db.query(models.ActivityLog).filter(
        models.ActivityLog.action == "SYNC",
        models.ActivityLog.entity_type == "SYSTEM",
        models.ActivityLog.details.like("%Starting Samsara sync operation%")
    ).order_by(models.ActivityLog.created_at.desc()).first()
    
    if in_progress_log:
        # Update the existing log entry to mark it as complete
        in_progress_log.action = "SYNC_COMPLETE"
        in_progress_log.details = "Manually reset sync status (originally started at " + in_progress_log.details.split("at ")[1] + ")"
        db.commit()
    
    # Create a new activity log entry to mark sync as complete
    reset_log = models.ActivityLog(
        user_id=current_user.user_id,
        action="SYNC_COMPLETE",
        entity_type="SYSTEM",
        entity_id=0,
        details="Manually reset sync status"
    )
    db.add(reset_log)
    db.commit()
    
    return {
        "message": "Sync status reset successfully",
        "status": "completed"
    }

async def background_sync_samsara(db: Session, created_by: int):
    """
    Background task to sync all vehicles from Samsara.
    This function will fetch vehicles, update existing ones, and create new ones as needed.
    It will also sync diagnostic codes and maintenance information.
    """
    try:
        # Log start of sync
        logger.info("Starting Samsara sync operation")
        start_log = models.ActivityLog(
            user_id=created_by,
            action="SYNC",
            entity_type="SYSTEM",
            entity_id=0,
            details=f"Starting Samsara sync operation at {datetime.now()}"
        )
        db.add(start_log)
        db.commit()
        
        # Get vehicles from Samsara
        vehicles = await fetch_samsara_vehicles()
        
        # Log the number of vehicles fetched
        logger.info(f"Processing {len(vehicles)} vehicles from Samsara")
        
        results = []
        for vehicle in vehicles:
            # Log the vehicle data for debugging
            logger.info(f"Processing vehicle: {vehicle}")
            
            # Get vehicle details from Samsara
            # The API response structure might be different than expected
            # Check if 'id' is directly in the vehicle object or nested
            samsara_id = None
            if "id" in vehicle:
                samsara_id = str(vehicle.get("id"))
            elif "data" in vehicle and "id" in vehicle["data"]:
                samsara_id = str(vehicle["data"].get("id"))
            else:
                logger.warning(f"Could not find ID in vehicle data: {vehicle}")
                continue  # Skip this vehicle if we can't find an ID
            
            logger.info(f"Processing vehicle with Samsara ID: {samsara_id}")
            
            # Get vehicle name/info
            vehicle_name = vehicle.get("name", "Unknown Vehicle")
            
            # Convert meters to miles for odometer
            odometer_meters = vehicle.get("odometerMeters", 0)
            miles = int(odometer_meters / 1609.34) if odometer_meters else 0
            
            # Extract make/model/year from name if available
            make = "Unknown"
            model = "Unknown"
            year = datetime.now().year
            
            # Try to extract make/model from name (e.g., "Peterbilt 579")
            if vehicle_name and " " in vehicle_name:
                parts = vehicle_name.split(" ", 1)
                make = parts[0]
                model = parts[1]
            
            # Try to get more details with enhanced telematics data
            vehicle_stats = None
            try:
                # Request a comprehensive set of telematics data
                # The fetch_vehicle_stats function now handles batching
                stat_types = ["engineStates", "obdOdometerMeters", "fuelPercents", "gps", 
                             "faultCodes", "engineRpm", "engineLoadPercent", "engineCoolantTemperatureMilliC"]
                vehicle_stats = await fetch_vehicle_stats(samsara_id, stat_types)
                logger.info(f"Successfully fetched detailed stats for vehicle {samsara_id}")
            except Exception as e:
                logger.warning(f"Could not get detailed stats for vehicle {samsara_id}: {str(e)}")
            
            # Extract data from vehicle stats
            engine_hours = None
            gps_data = None
            fuel_level = None
            fault_codes = []
            engine_data = {}
            
            if vehicle_stats:
                # Extract basic stats
                engine_hours = vehicle_stats.get("engineHours")
                
                # Extract GPS data if available
                if "gps" in vehicle_stats:
                    gps_data = vehicle_stats["gps"]
                
                # Extract fuel level if available
                if "fuelPercents" in vehicle_stats:
                    fuel_level = vehicle_stats["fuelPercents"]
                
                # Extract fault codes if available
                if "faultCodes" in vehicle_stats:
                    fault_codes = vehicle_stats["faultCodes"]
                
                # Extract engine data if available
                if "engineRpm" in vehicle_stats:
                    engine_data["rpm"] = vehicle_stats["engineRpm"]
                if "engineLoadPercent" in vehicle_stats:
                    engine_data["load"] = vehicle_stats["engineLoadPercent"]
                if "engineCoolantTemperatureMilliC" in vehicle_stats:
                    engine_data["coolant_temp"] = vehicle_stats["engineCoolantTemperatureMilliC"]
            
            # Check if vehicle already exists by Samsara ID
            db_vehicle = db.query(models.Vehicle).filter(
                models.Vehicle.samsara_id == samsara_id
            ).first()
            
            if db_vehicle:
                # Update existing vehicle
                db_vehicle.unit_number = vehicle.get("name")  # Store Samsara name as unit number
                db_vehicle.license_plate = vehicle.get("licensePlate")  # Store license plate
                db_vehicle.mileage = miles
                if engine_hours is not None:
                    db_vehicle.engine_hours = engine_hours
                db_vehicle.updated_at = datetime.utcnow()
                
                # Log update
                activity_log = models.ActivityLog(
                    user_id=created_by,
                    action="UPDATE",
                    entity_type="VEHICLE",
                    entity_id=db_vehicle.vehicle_id,
                    details=f"Updated vehicle from Samsara: {db_vehicle.vin or samsara_id}"
                )
                db.add(activity_log)
                
                result = {
                    "action": "updated",
                    "vehicle_id": db_vehicle.vehicle_id,
                    "samsara_id": db_vehicle.samsara_id
                }
            else:
                # Create new vehicle placeholder
                make = vehicle.get("make", "Unknown")
                model = vehicle.get("model", "Unknown")
                year = vehicle.get("year", datetime.now().year)
                vin = vehicle.get("vin", f"SAMSARA-{samsara_id}")
                
                new_vehicle = models.Vehicle(
                    samsara_id=samsara_id,
                    unit_number=vehicle.get("name"),  # Store Samsara name as unit number
                    license_plate=vehicle.get("licensePlate"),  # Store license plate
                    make=make,
                    model=model,
                    year=year,
                    vin=vin,
                    status="Active",
                    mileage=miles,
                    engine_hours=engine_hours
                )
                db.add(new_vehicle)
                db.flush()
                
                # Log creation
                activity_log = models.ActivityLog(
                    user_id=created_by,
                    action="CREATE",
                    entity_type="VEHICLE",
                    entity_id=new_vehicle.vehicle_id,
                    details=f"Created vehicle from Samsara: {vin}"
                )
                db.add(activity_log)
                
                result = {
                    "action": "created",
                    "vehicle_id": new_vehicle.vehicle_id,
                    "samsara_id": new_vehicle.samsara_id
                }
            
            db.commit()
            
            # Sync diagnostic codes for the vehicle
            try:
                vehicle_id = db_vehicle.vehicle_id if db_vehicle else new_vehicle.vehicle_id
                diagnostic_codes = await fetch_diagnostic_codes(samsara_id)
                
                # Process diagnostic codes
                code_results = []
                for code_data in diagnostic_codes:
                    # Check if code already exists
                    code_value = code_data.get("code", "Unknown")
                    
                    existing_code = db.query(models.DiagnosticCode).filter(
                        models.DiagnosticCode.vehicle_id == vehicle_id,
                        models.DiagnosticCode.code == code_value
                    ).first()
                    
                    if not existing_code:
                        # Parse reported date
                        reported_date_str = code_data.get("reported_date")
                        if reported_date_str:
                            try:
                                reported_date = datetime.fromisoformat(reported_date_str.replace('Z', '+00:00'))
                            except ValueError:
                                reported_date = datetime.utcnow()
                        else:
                            reported_date = datetime.utcnow()
                        
                        # Create new diagnostic code
                        new_code = models.DiagnosticCode(
                            vehicle_id=vehicle_id,
                            code=code_value,
                            description=code_data.get("description", ""),
                            severity=code_data.get("severity", "Medium"),
                            reported_date=reported_date
                        )
                        db.add(new_code)
                        code_results.append({
                            "action": "created",
                            "code": code_value,
                            "type": code_data.get("type", "unknown")
                        })
                
                result["diagnostic_codes"] = code_results
                db.commit()
                
            except Exception as e:
                logger.error(f"Error syncing diagnostic codes for vehicle {samsara_id}: {str(e)}")
                result["diagnostic_codes_error"] = str(e)
            
            results.append(result)
        
        # Log completion
        completion_log = models.ActivityLog(
            user_id=created_by,
            action="SYNC_COMPLETE",
            entity_type="SYSTEM",
            entity_id=0,
            details=f"Completed Samsara sync operation. Processed {len(results)} vehicles."
        )
        db.add(completion_log)
        db.commit()
        
        logger.info(f"Samsara sync completed successfully. Processed {len(results)} vehicles.")
        return results
        
    except Exception as e:
        logger.error(f"Error during Samsara sync: {str(e)}")
        # Log error
        error_log = models.ActivityLog(
            user_id=created_by,
            action="ERROR",
            entity_type="SYSTEM",
            entity_id=0,
            details=f"Samsara sync error: {str(e)}"
        )
        db.add(error_log)
        db.commit()
        
        return {"error": str(e)}
