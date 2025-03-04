# This goes in backend/App/Api/endpoints/samsara.py
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks, status
from sqlalchemy.orm import Session
from typing import List, Dict, Any, Optional
import httpx
import os
import logging
from datetime import datetime, timedelta

import models
import schemas
from database import get_db
from auth import get_current_active_user, check_manager

# Environment variable for Samsara API key
SAMSARA_API_KEY = os.getenv("SAMSARA_API_KEY")
SAMSARA_API_BASE_URL = "https://api.samsara.com/v1"

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
            
            return response.json().get("vehicles", [])
    except Exception as e:
        logger.error(f"Error fetching vehicles from Samsara: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching vehicles from Samsara: {str(e)}"
        )

async def fetch_vehicle_stats(vehicle_id: str):
    """
    Fetch detailed vehicle statistics from Samsara API.
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
    
    logger.info(f"Fetching stats for vehicle {vehicle_id}")
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{SAMSARA_API_BASE_URL}/fleet/vehicles/stats",
                headers=headers,
                params={"vehicles": vehicle_id}
            )
            
            if response.status_code != 200:
                logger.error(f"Error from Samsara API: {response.text}")
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail=f"Error from Samsara API: {response.text}"
                )
            
            return response.json().get("vehicles", [{}])[0]
    except Exception as e:
        logger.error(f"Error fetching vehicle stats: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, 
            detail=f"Error fetching vehicle stats: {str(e)}"
        )

async def fetch_diagnostic_codes(vehicle_id: str):
    """
    Fetch diagnostic codes for a vehicle from Samsara API.
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
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{SAMSARA_API_BASE_URL}/fleet/maintenance/dvirs",
                headers=headers,
                params={"vehicleId": vehicle_id}
            )
            
            if response.status_code != 200:
                logger.error(f"Error from Samsara API: {response.text}")
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail=f"Error from Samsara API: {response.text}"
                )
            
            return response.json().get("dvirs", [])
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

@router.get("/vehicle/{vehicle_id}/stats", summary="Get vehicle stats from Samsara")
async def get_vehicle_stats(
    vehicle_id: str,
    current_user: models.User = Depends(get_current_active_user)
):
    """
    Get detailed statistics for a specific vehicle from Samsara.
    """
    try:
        stats = await fetch_vehicle_stats(vehicle_id)
        return stats
    except Exception as e:
        logger.error(f"Error fetching vehicle stats: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching vehicle stats from Samsara: {str(e)}"
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
        
        results = []
        for vehicle in vehicles:
            # Get vehicle details from Samsara
            samsara_id = str(vehicle.get("id"))
            
            # Convert meters to miles for odometer
            odometer_meters = vehicle.get("odometerMeters", 0)
            miles = int(odometer_meters / 1609.34) if odometer_meters else 0
            
            # Try to get more details like engine hours
            vehicle_stats = None
            try:
                vehicle_stats = await fetch_vehicle_stats(samsara_id)
            except Exception as e:
                logger.warning(f"Could not get detailed stats for vehicle {samsara_id}: {str(e)}")
            
            engine_hours = None
            if vehicle_stats:
                engine_hours = vehicle_stats.get("engineHours")
            
            # Check if vehicle already exists by Samsara ID
            db_vehicle = db.query(models.Vehicle).filter(
                models.Vehicle.samsara_id == samsara_id
            ).first()
            
            if db_vehicle:
                # Update existing vehicle
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
                    if "defects" in code_data:
                        for defect in code_data["defects"]:
                            # Check if code already exists
                            defect_code = defect.get("defectCode", "Unknown")
                            
                            existing_code = db.query(models.DiagnosticCode).filter(
                                models.DiagnosticCode.vehicle_id == vehicle_id,
                                models.DiagnosticCode.code == defect_code
                            ).first()
                            
                            if not existing_code:
                                # Create new diagnostic code
                                inspection_time = code_data.get("inspectionTimeMs")
                                reported_date = None
                                if inspection_time:
                                    reported_date = datetime.fromtimestamp(inspection_time / 1000)
                                else:
                                    reported_date = datetime.utcnow()
                                
                                new_code = models.DiagnosticCode(
                                    vehicle_id=vehicle_id,
                                    code=defect_code,
                                    description=defect.get("comment", ""),
                                    severity="Medium",  # Default severity
                                    reported_date=reported_date
                                )
                                db.add(new_code)
                                code_results.append({
                                    "action": "created",
                                    "code": defect_code
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