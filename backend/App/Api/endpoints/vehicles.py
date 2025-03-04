# routers/vehicles.py
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime

import models
import schemas
from database import get_db
from auth import get_current_active_user, check_technician, check_manager

router = APIRouter(
    prefix="/api/vehicles",
    tags=["vehicles"],
    dependencies=[Depends(get_current_active_user)],
    responses={404: {"description": "Vehicle not found"}},
)

@router.get("/", response_model=List[schemas.Vehicle], summary="Get all vehicles")
async def get_vehicles(
    skip: int = 0, 
    limit: int = 100,
    status: Optional[str] = None,
    department: Optional[str] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """
    Get all vehicles with optional filtering.
    """
    query = db.query(models.Vehicle)
    
    # Apply filters if provided
    if status:
        query = query.filter(models.Vehicle.status == status)
    if department:
        query = query.filter(models.Vehicle.department == department)
    
    # Search functionality
    if search:
        search_term = f"%{search}%"
        query = query.filter(
            models.Vehicle.vin.ilike(search_term) |
            models.Vehicle.make.ilike(search_term) |
            models.Vehicle.model.ilike(search_term) |
            models.Vehicle.license_plate.ilike(search_term)
        )
    
    # Get results with pagination
    vehicles = query.order_by(models.Vehicle.vehicle_id).offset(skip).limit(limit).all()
    return vehicles

@router.get("/{vehicle_id}", response_model=schemas.Vehicle, summary="Get a specific vehicle")
async def get_vehicle(
    vehicle_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """
    Get a specific vehicle by ID.
    """
    vehicle = db.query(models.Vehicle).filter(models.Vehicle.vehicle_id == vehicle_id).first()
    if vehicle is None:
        raise HTTPException(status_code=404, detail="Vehicle not found")
    return vehicle

@router.post("/", response_model=schemas.Vehicle, status_code=status.HTTP_201_CREATED, summary="Create a new vehicle")
async def create_vehicle(
    vehicle: schemas.VehicleCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(check_manager)
):
    """
    Create a new vehicle (requires manager role).
    """
    # Check if vehicle with this VIN already exists
    db_vehicle = db.query(models.Vehicle).filter(models.Vehicle.vin == vehicle.vin).first()
    if db_vehicle:
        raise HTTPException(status_code=400, detail="Vehicle with this VIN already exists")
    
    # Create new vehicle
    new_vehicle = models.Vehicle(**vehicle.dict())
    db.add(new_vehicle)
    db.commit()
    db.refresh(new_vehicle)
    
    # Log activity
    activity_log = models.ActivityLog(
        user_id=current_user.user_id,
        action="CREATE",
        entity_type="VEHICLE",
        entity_id=new_vehicle.vehicle_id,
        details=f"Created vehicle: {new_vehicle.make} {new_vehicle.model}",
    )
    db.add(activity_log)
    db.commit()
    
    return new_vehicle

@router.put("/{vehicle_id}", response_model=schemas.Vehicle, summary="Update a vehicle")
async def update_vehicle(
    vehicle_id: int,
    vehicle_update: schemas.VehicleUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(check_technician)
):
    """
    Update a vehicle's information (requires technician role or higher).
    """
    db_vehicle = db.query(models.Vehicle).filter(models.Vehicle.vehicle_id == vehicle_id).first()
    if db_vehicle is None:
        raise HTTPException(status_code=404, detail="Vehicle not found")
    
    # Check if updating VIN and if it already exists
    if vehicle_update.vin and vehicle_update.vin != db_vehicle.vin:
        existing_vin = db.query(models.Vehicle).filter(
            models.Vehicle.vin == vehicle_update.vin,
            models.Vehicle.vehicle_id != vehicle_id
        ).first()
        if existing_vin:
            raise HTTPException(status_code=400, detail="Vehicle with this VIN already exists")
    
    # Update vehicle attributes
    update_data = vehicle_update.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_vehicle, key, value)
    
    db_vehicle.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(db_vehicle)
    
    # Log activity
    activity_log = models.ActivityLog(
        user_id=current_user.user_id,
        action="UPDATE",
        entity_type="VEHICLE",
        entity_id=db_vehicle.vehicle_id,
        details=f"Updated vehicle: {db_vehicle.make} {db_vehicle.model}",
    )
    db.add(activity_log)
    db.commit()
    
    return db_vehicle

@router.delete("/{vehicle_id}", status_code=status.HTTP_204_NO_CONTENT, summary="Delete a vehicle")
async def delete_vehicle(
    vehicle_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(check_manager)
):
    """
    Delete a vehicle (requires manager role).
    """
    db_vehicle = db.query(models.Vehicle).filter(models.Vehicle.vehicle_id == vehicle_id).first()
    if db_vehicle is None:
        raise HTTPException(status_code=404, detail="Vehicle not found")
    
    # Store vehicle info for logging
    vehicle_info = f"{db_vehicle.make} {db_vehicle.model} (VIN: {db_vehicle.vin})"
    
    # Delete the vehicle
    db.delete(db_vehicle)
    
    # Log activity
    activity_log = models.ActivityLog(
        user_id=current_user.user_id,
        action="DELETE",
        entity_type="VEHICLE",
        entity_id=vehicle_id,
        details=f"Deleted vehicle: {vehicle_info}",
    )
    db.add(activity_log)
    db.commit()
    
    return None

@router.get("/{vehicle_id}/work-orders", response_model=List[schemas.WorkOrder], summary="Get vehicle work orders")
async def get_vehicle_work_orders(
    vehicle_id: int,
    status: Optional[str] = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """
    Get all work orders for a specific vehicle with optional status filtering.
    """
    # Check if vehicle exists
    vehicle = db.query(models.Vehicle).filter(models.Vehicle.vehicle_id == vehicle_id).first()
    if vehicle is None:
        raise HTTPException(status_code=404, detail="Vehicle not found")
    
    # Query work orders
    query = db.query(models.WorkOrder).filter(models.WorkOrder.vehicle_id == vehicle_id)
    
    # Apply status filter if provided
    if status:
        query = query.filter(models.WorkOrder.status == status)
    
    work_orders = query.order_by(models.WorkOrder.created_at.desc()).offset(skip).limit(limit).all()
    return work_orders

@router.get("/{vehicle_id}/maintenance", response_model=List[schemas.VehicleMaintenanceSchedule], summary="Get vehicle maintenance schedules")
async def get_vehicle_maintenance(
    vehicle_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """
    Get all maintenance schedules for a specific vehicle.
    """
    # Check if vehicle exists
    vehicle = db.query(models.Vehicle).filter(models.Vehicle.vehicle_id == vehicle_id).first()
    if vehicle is None:
        raise HTTPException(status_code=404, detail="Vehicle not found")
    
    # Get maintenance schedules
    maintenance_schedules = db.query(models.VehicleMaintenanceSchedule).filter(
        models.VehicleMaintenanceSchedule.vehicle_id == vehicle_id
    ).all()
    
    return maintenance_schedules