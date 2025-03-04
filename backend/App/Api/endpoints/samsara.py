# routers/samsara.py
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks, status
from sqlalchemy.orm import Session
from typing import List, Dict, Any, Optional
import httpx
import os
from datetime import datetime, timedelta

import models
import schemas
from database import get_db
from auth import get_current_active_user, check_manager

# Environment variable for Samsara API key
SAMSARA_API_KEY = os.getenv("SAMSARA_API_KEY")
SAMSARA_API_BASE_URL = "https://api.samsara.com/v1"

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
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Samsara API key not configured"
        )
    
    headers = {
        "Authorization": f"Bearer {SAMSARA_API_KEY}"
    }
    
    async with httpx.AsyncClient() as client:
        response = await client.get(
            f"{SAMSARA_API_BASE_URL}/fleet/vehicles",
            headers=headers
        )
        
        if response.status_code != 200:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Error from Samsara API: {response.text}"
            )
        
        return response.json().get("vehicles", [])

async def sync_vehicle_data(db: Session, vehicle_data: Dict[str, Any], created_by: int):
    """
    Sync a single vehicle's data from Samsara to the database.
    """
    # Check if vehicle already exists by Samsara ID
    db_vehicle = db.query(models.Vehicle).filter(
        models.Vehicle.samsara_id == str(vehicle_data.get("id"))
    ).first()
    
    # Convert meters to miles for odometer
    miles = vehicle_data.get("odometerMeters", 0) / 1609.34
    
    if db_vehicle:
        # Update existing vehicle
        db_vehicle.mileage = int(miles)
        db_vehicle.engine_hours = vehicle_data.get("engineHours", db_vehicle.engine_hours)
        db_vehicle.updated_at = datetime.utcnow()
        
        # Log update
        activity_log = models.ActivityLog(
            user_id=created_by,
            action="UPDATE",
            entity_type="VEHICLE",
            entity_id=db_vehicle.vehicle_id,
            details=f"Updated vehicle from Samsara: {db_vehicle.vin}"
        )
        db.add(activity_log)
        
        result = {
            "action": "updated",
            "vehicle_id": db_vehicle.vehicle_id,
            "samsara_id": db_vehicle.samsara_id
        }
    else:
        # Create new vehicle placeholder
        new_vehicle = models.Vehicle(
            samsara_id=str(vehicle_data.get("id")),
            make=vehicle_data.get("make", "Unknown"),
            model=vehicle_data.get("model", "Unknown"),
            year=vehicle_data.get("year", datetime.now().year),
            vin=vehicle_data.get("vin", f"SAMSARA-{vehicle_data.get('id')}"),
            status="Active",
            mileage=int(miles),
            engine_hours=vehicle_data.get("engineHours")
        )
        db.add(new_vehicle)
        db.flush()
        
        # Log creation
        activity_log = models.ActivityLog(
            user_id=created_by,
            action="CREATE",
            entity_type="VEHICLE",
            entity_id=new_vehicle.vehicle_id,
            details=f"Created vehicle from Samsara: {new_vehicle.vin}"
        )
        db.add(activity_log)
        
        result = {
            "action": "created",
            "vehicle_id": new_vehicle.vehicle_id,
            "samsara_id": new_vehicle.samsara_id
        }
    
    db.commit()
    return result

async def sync_diagnostic_codes(db: Session, vehicle_id: int, samsara_id: str, created_by: int):
    """
    Sync diagnostic codes for a vehicle from Samsara.
    """
    if not SAMSARA_API_KEY:
        return {"error": "Samsara API key not configured"}
    
    headers = {
        "Authorization": f"Bearer {SAMSARA_API_KEY}"
    }
    
    # Get diagnostic codes from Samsara
    async with httpx.AsyncClient() as client:
        response = await client.get(
            f"{SAMSARA_API_BASE_URL}/fleet/maintenance/dvirs",
            headers=headers,
            params={"vehicleId": samsara_id}
        )
        
        if response.status_code != 200:
            return {"error": f"Error fetching diagnostic codes: {response.text}"}
        
        data = response.json()
        
        # Process diagnostic codes
        results = []
        for code_data in data.get("dvirs", []):
            if "defects" in code_data:
                for defect in code_data["defects"]:
                    # Check if code already exists
                    existing_code = db.query(models.DiagnosticCode).filter(
                        models.DiagnosticCode.vehicle_id == vehicle_id,
                        models.DiagnosticCode.code == defect.get("defectCode", "Unknown")
                    ).first()
                    
                    if not existing_code:
                        # Create new diagnostic code
                        new_code = models.DiagnosticCode(
                            vehicle_id=vehicle_id,
                            code=defect.get("defectCode", "Unknown"),
                            description=defect.get("comment", ""),
                            severity="Medium",  # Default severity
                            reported_date=datetime.utcnow()
                        )
                        db.add(new_code)
                        results.append({
                            "action": "created",
                            "code": defect.get("defectCode", "Unknown")
                        })
        
        db.commit()
        return results

async def background_sync_samsara(db: Session, created_by: int):
    """
    Background task to sync all vehicles from Samsara.
    """
    try:
        # Get vehicles from Samsara
        vehicles = await fetch_samsara_vehicles()
        
        results = []
        for vehicle in vehicles:
            # Sync vehicle data
            result = await sync_vehicle_data(db, vehicle, created_by)
            
            # Sync diagnostic codes for the vehicle
            if result["action"] in ["updated", "created"]:
                codes_result = await sync_diagnostic_codes(
                    db, 
                    result["vehicle_id"], 
                    result["samsara_id"], 
                    created_by
                )
                result["diagnostic_codes"] = codes_result
            
            results.append(result)
        
        return results
    except Exception as e:
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
        models.ActivityLog.action.in_(["CREATE", "UPDATE"]),
        models.ActivityLog.entity_type == "VEHICLE",
        models.ActivityLog.details.like("% from Samsara: %")
    ).order_by(models.ActivityLog.created_at.desc()).limit(10).all()
    
    if not sync_logs:
        return {
            "status": "unknown",
            "message": "No sync operations found"
        }
    
    latest_sync = sync_logs[0]
    
    # Calculate counts
    created_count = sum(1 for log in sync_logs if "Created vehicle from Samsara" in log.details)
    updated_count = sum(1 for log in sync_logs if "Updated vehicle from Samsara" in log.details)
    
    return {
        "status": "completed",
        "latest_sync": latest_sync.created_at,
        "created": created_count,
        "updated": updated_count
    }
