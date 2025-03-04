# routers/maintenance.py
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_, desc
from typing import List, Optional
from datetime import datetime, timedelta

import models
import schemas
from database import get_db
from auth import get_current_active_user, check_technician, check_manager

router = APIRouter(
    prefix="/api/maintenance",
    tags=["maintenance"],
    dependencies=[Depends(get_current_active_user)],
    responses={404: {"description": "Maintenance schedule not found"}},
)

@router.get("/schedules", response_model=List[schemas.MaintenanceSchedule], summary="Get all maintenance schedules")
async def get_maintenance_schedules(
    skip: int = 0, 
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """
    Get all maintenance schedule templates.
    """
    schedules = db.query(models.MaintenanceSchedule).order_by(
        models.MaintenanceSchedule.name
    ).offset(skip).limit(limit).all()
    
    return schedules

@router.post("/schedules", response_model=schemas.MaintenanceSchedule, status_code=status.HTTP_201_CREATED, summary="Create a maintenance schedule")
async def create_maintenance_schedule(
    schedule: schemas.MaintenanceScheduleCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(check_technician)
):
    """
    Create a new maintenance schedule template (requires technician role or higher).
    """
    # Validate that at least one interval type is set
    if not any([schedule.is_mileage_based, schedule.is_time_based, schedule.is_engine_hours_based]):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="At least one interval type (mileage, time, or engine hours) must be set"
        )
    
    # Validate that intervals are provided for the types that are set
    if schedule.is_mileage_based and not schedule.mileage_interval:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Mileage interval must be provided if is_mileage_based is true"
        )
    
    if schedule.is_time_based and not schedule.time_interval_days:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Time interval days must be provided if is_time_based is true"
        )
    
    if schedule.is_engine_hours_based and not schedule.engine_hours_interval:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Engine hours interval must be provided if is_engine_hours_based is true"
        )
    
    # Create new schedule
    new_schedule = models.MaintenanceSchedule(**schedule.dict())
    db.add(new_schedule)
    
    # Log activity
    activity_log = models.ActivityLog(
        user_id=current_user.user_id,
        action="CREATE",
        entity_type="MAINTENANCE_SCHEDULE",
        entity_id=0,  # Will be updated after commit
        details=f"Created maintenance schedule: {schedule.name}"
    )
    db.add(activity_log)
    
    db.commit()
    db.refresh(new_schedule)
    
    # Update activity log with the new schedule ID
    activity_log.entity_id = new_schedule.schedule_id
    db.commit()
    
    return new_schedule

@router.get("/schedules/{schedule_id}", response_model=schemas.MaintenanceSchedule, summary="Get a specific maintenance schedule")
async def get_maintenance_schedule(
    schedule_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """
    Get a specific maintenance schedule template by ID.
    """
    schedule = db.query(models.MaintenanceSchedule).filter(
        models.MaintenanceSchedule.schedule_id == schedule_id
    ).first()
    
    if schedule is None:
        raise HTTPException(status_code=404, detail="Maintenance schedule not found")
    
    return schedule

@router.put("/schedules/{schedule_id}", response_model=schemas.MaintenanceSchedule, summary="Update a maintenance schedule")
async def update_maintenance_schedule(
    schedule_id: int,
    schedule_update: schemas.MaintenanceScheduleUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(check_technician)
):
    """
    Update a maintenance schedule template (requires technician role or higher).
    """
    # Get existing schedule
    db_schedule = db.query(models.MaintenanceSchedule).filter(
        models.MaintenanceSchedule.schedule_id == schedule_id
    ).first()
    
    if db_schedule is None:
        raise HTTPException(status_code=404, detail="Maintenance schedule not found")
    
    # Update schedule attributes
    update_data = schedule_update.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_schedule, key, value)
    
    # Validate that at least one interval type is set
    if not any([db_schedule.is_mileage_based, db_schedule.is_time_based, db_schedule.is_engine_hours_based]):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="At least one interval type (mileage, time, or engine hours) must be set"
        )
    
    # Validate that intervals are provided for the types that are set
    if db_schedule.is_mileage_based and not db_schedule.mileage_interval:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Mileage interval must be provided if is_mileage_based is true"
        )
    
    if db_schedule.is_time_based and not db_schedule.time_interval_days:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Time interval days must be provided if is_time_based is true"
        )
    
    if db_schedule.is_engine_hours_based and not db_schedule.engine_hours_interval:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Engine hours interval must be provided if is_engine_hours_based is true"
        )
    
    db_schedule.updated_at = datetime.utcnow()
    
    # Log activity
    activity_log = models.ActivityLog(
        user_id=current_user.user_id,
        action="UPDATE",
        entity_type="MAINTENANCE_SCHEDULE",
        entity_id=db_schedule.schedule_id,
        details=f"Updated maintenance schedule: {db_schedule.name}"
    )
    db.add(activity_log)
    
    db.commit()
    db.refresh(db_schedule)
    
    return db_schedule

@router.delete("/schedules/{schedule_id}", status_code=status.HTTP_204_NO_CONTENT, summary="Delete a maintenance schedule")
async def delete_maintenance_schedule(
    schedule_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(check_manager)  # Only managers can delete schedules
):
    """
    Delete a maintenance schedule template (requires manager role).
    """
    # Get existing schedule
    db_schedule = db.query(models.MaintenanceSchedule).filter(
        models.MaintenanceSchedule.schedule_id == schedule_id
    ).first()
    
    if db_schedule is None:
        raise HTTPException(status_code=404, detail="Maintenance schedule not found")
    
    # Check if schedule is assigned to any vehicles
    vehicle_schedules = db.query(models.VehicleMaintenanceSchedule).filter(
        models.VehicleMaintenanceSchedule.schedule_id == schedule_id
    ).first()
    
    if vehicle_schedules:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete schedule that is assigned to vehicles. Remove assignments first."
        )
    
    # Store schedule info for logging
    schedule_info = db_schedule.name
    
    # Delete the schedule
    db.delete(db_schedule)
    
    # Log activity
    activity_log = models.ActivityLog(
        user_id=current_user.user_id,
        action="DELETE",
        entity_type="MAINTENANCE_SCHEDULE",
        entity_id=schedule_id,
        details=f"Deleted maintenance schedule: {schedule_info}"
    )
    db.add(activity_log)
    
    db.commit()
    
    return None

@router.get("/vehicle-schedules", response_model=List[schemas.VehicleMaintenanceScheduleWithDetails], summary="Get vehicle maintenance schedules")
async def get_vehicle_maintenance_schedules(
    vehicle_id: Optional[int] = None,
    due_soon: Optional[bool] = None,
    overdue: Optional[bool] = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """
    Get all vehicle maintenance schedule assignments with optional filtering.
    """
    # Start with join query to get vehicle and schedule details
    query = db.query(
        models.VehicleMaintenanceSchedule,
        models.Vehicle,
        models.MaintenanceSchedule
    ).join(
        models.Vehicle,
        models.VehicleMaintenanceSchedule.vehicle_id == models.Vehicle.vehicle_id
    ).join(
        models.MaintenanceSchedule,
        models.VehicleMaintenanceSchedule.schedule_id == models.MaintenanceSchedule.schedule_id
    )
    
    # Apply vehicle filter if provided
    if vehicle_id:
        query = query.filter(models.VehicleMaintenanceSchedule.vehicle_id == vehicle_id)
    
    # Apply due soon filter (within next 7 days or 500 miles)
    if due_soon:
        now = datetime.utcnow()
        soon = now + timedelta(days=7)
        
        query = query.filter(
            or_(
                and_(
                    models.MaintenanceSchedule.is_time_based == True,
                    models.VehicleMaintenanceSchedule.next_due_date.isnot(None),
                    models.VehicleMaintenanceSchedule.next_due_date > now,
                    models.VehicleMaintenanceSchedule.next_due_date <= soon
                ),
                and_(
                    models.MaintenanceSchedule.is_mileage_based == True,
                    models.VehicleMaintenanceSchedule.next_due_mileage.isnot(None),
                    models.Vehicle.mileage.isnot(None),
                    models.VehicleMaintenanceSchedule.next_due_mileage - models.Vehicle.mileage <= 500,
                    models.VehicleMaintenanceSchedule.next_due_mileage > models.Vehicle.mileage
                ),
                and_(
                    models.MaintenanceSchedule.is_engine_hours_based == True,
                    models.VehicleMaintenanceSchedule.next_due_engine_hours.isnot(None),
                    models.Vehicle.engine_hours.isnot(None),
                    models.VehicleMaintenanceSchedule.next_due_engine_hours - models.Vehicle.engine_hours <= 50,
                    models.VehicleMaintenanceSchedule.next_due_engine_hours > models.Vehicle.engine_hours
                )
            )
        )
    
    # Apply overdue filter
    if overdue:
        query = query.filter(
            or_(
                and_(
                    models.MaintenanceSchedule.is_time_based == True,
                    models.VehicleMaintenanceSchedule.next_due_date.isnot(None),
                    models.VehicleMaintenanceSchedule.next_due_date < datetime.utcnow()
                ),
                and_(
                    models.MaintenanceSchedule.is_mileage_based == True,
                    models.VehicleMaintenanceSchedule.next_due_mileage.isnot(None),
                    models.Vehicle.mileage.isnot(None),
                    models.VehicleMaintenanceSchedule.next_due_mileage < models.Vehicle.mileage
                ),
                and_(
                    models.MaintenanceSchedule.is_engine_hours_based == True,
                    models.VehicleMaintenanceSchedule.next_due_engine_hours.isnot(None),
                    models.Vehicle.engine_hours.isnot(None),
                    models.VehicleMaintenanceSchedule.next_due_engine_hours < models.Vehicle.engine_hours
                )
            )
        )
    
    # Get results with pagination
    results = query.order_by(
        models.VehicleMaintenanceSchedule.next_due_date.asc().nullslast()
    ).offset(skip).limit(limit).all()
    
    # Format response
    response = []
    for vehicle_schedule, vehicle, schedule in results:
        # Calculate due status
        is_overdue = False
        is_due_soon = False
        
        if schedule.is_time_based and vehicle_schedule.next_due_date:
            now = datetime.utcnow()
            if vehicle_schedule.next_due_date < now:
                is_overdue = True
            elif vehicle_schedule.next_due_date <= (now + timedelta(days=7)):
                is_due_soon = True
        
        if schedule.is_mileage_based and vehicle_schedule.next_due_mileage and vehicle.mileage:
            if vehicle_schedule.next_due_mileage < vehicle.mileage:
                is_overdue = True
            elif (vehicle_schedule.next_due_mileage - vehicle.mileage) <= 500:
                is_due_soon = True
        
        if schedule.is_engine_hours_based and vehicle_schedule.next_due_engine_hours and vehicle.engine_hours:
            if vehicle_schedule.next_due_engine_hours < vehicle.engine_hours:
                is_overdue = True
            elif (vehicle_schedule.next_due_engine_hours - vehicle.engine_hours) <= 50:
                is_due_soon = True
        
        response.append({
            "id": vehicle_schedule.id,
            "vehicle_id": vehicle_schedule.vehicle_id,
            "schedule_id": vehicle_schedule.schedule_id,
            "last_performed_date": vehicle_schedule.last_performed_date,
            "last_performed_mileage": vehicle_schedule.last_performed_mileage,
            "last_performed_engine_hours": vehicle_schedule.last_performed_engine_hours,
            "next_due_date": vehicle_schedule.next_due_date,
            "next_due_mileage": vehicle_schedule.next_due_mileage,
            "next_due_engine_hours": vehicle_schedule.next_due_engine_hours,
            "created_at": vehicle_schedule.created_at,
            "updated_at": vehicle_schedule.updated_at,
            "vehicle": {
                "vehicle_id": vehicle.vehicle_id,
                "make": vehicle.make,
                "model": vehicle.model,
                "year": vehicle.year,
                "vin": vehicle.vin,
                "license_plate": vehicle.license_plate,
                "mileage": vehicle.mileage,
                "engine_hours": vehicle.engine_hours,
                "status": vehicle.status
            },
            "schedule": {
                "schedule_id": schedule.schedule_id,
                "name": schedule.name,
                "description": schedule.description,
                "is_mileage_based": schedule.is_mileage_based,
                "is_time_based": schedule.is_time_based,
                "is_engine_hours_based": schedule.is_engine_hours_based,
                "mileage_interval": schedule.mileage_interval,
                "time_interval_days": schedule.time_interval_days,
                "engine_hours_interval": schedule.engine_hours_interval
            },
            "is_overdue": is_overdue,
            "is_due_soon": is_due_soon
        })
    
    return response

@router.post("/vehicle-schedules", response_model=schemas.VehicleMaintenanceSchedule, status_code=status.HTTP_201_CREATED, summary="Assign maintenance schedule to vehicle")
async def assign_maintenance_schedule(
    assignment: schemas.VehicleMaintenanceScheduleCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(check_technician)
):
    """
    Assign a maintenance schedule to a vehicle (requires technician role or higher).
    """
    # Check if vehicle exists
    vehicle = db.query(models.Vehicle).filter(models.Vehicle.vehicle_id == assignment.vehicle_id).first()
    if not vehicle:
        raise HTTPException(status_code=404, detail="Vehicle not found")
    
    # Check if schedule exists
    schedule = db.query(models.MaintenanceSchedule).filter(
        models.MaintenanceSchedule.schedule_id == assignment.schedule_id
    ).first()
    if not schedule:
        raise HTTPException(status_code=404, detail="Maintenance schedule not found")
    
    # Check if assignment already exists
    existing_assignment = db.query(models.VehicleMaintenanceSchedule).filter(
        models.VehicleMaintenanceSchedule.vehicle_id == assignment.vehicle_id,
        models.VehicleMaintenanceSchedule.schedule_id == assignment.schedule_id
    ).first()
    
    if existing_assignment:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This maintenance schedule is already assigned to this vehicle"
        )
    
    # Calculate next due dates/values
    next_due_date = None
    if schedule.is_time_based and schedule.time_interval_days:
        if assignment.last_performed_date:
            next_due_date = assignment.last_performed_date + timedelta(days=schedule.time_interval_days)
        else:
            next_due_date = datetime.utcnow() + timedelta(days=schedule.time_interval_days)
    
    next_due_mileage = None
    if schedule.is_mileage_based and schedule.mileage_interval:
        if assignment.last_performed_mileage:
            next_due_mileage = assignment.last_performed_mileage + schedule.mileage_interval
        elif vehicle.mileage:
            next_due_mileage = vehicle.mileage + schedule.mileage_interval
    
    next_due_engine_hours = None
    if schedule.is_engine_hours_based and schedule.engine_hours_interval:
        if assignment.last_performed_engine_hours:
            next_due_engine_hours = assignment.last_performed_engine_hours + schedule.engine_hours_interval
        elif vehicle.engine_hours:
            next_due_engine_hours = vehicle.engine_hours + schedule.engine_hours_interval
    
    # Create new assignment
    new_assignment = models.VehicleMaintenanceSchedule(
        vehicle_id=assignment.vehicle_id,
        schedule_id=assignment.schedule_id,
        last_performed_date=assignment.last_performed_date,
        last_performed_mileage=assignment.last_performed_mileage,
        last_performed_engine_hours=assignment.last_performed_engine_hours,
        next_due_date=next_due_date,
        next_due_mileage=next_due_mileage,
        next_due_engine_hours=next_due_engine_hours
    )
    db.add(new_assignment)
    
    # Log activity
    activity_log = models.ActivityLog(
        user_id=current_user.user_id,
        action="CREATE",
        entity_type="VEHICLE_MAINTENANCE_SCHEDULE",
        entity_id=0,  # Will be updated after commit
        details=f"Assigned maintenance schedule '{schedule.name}' to vehicle {vehicle.make} {vehicle.model} ({vehicle.vin})"
    )
    db.add(activity_log)
    
    db.commit()
    db.refresh(new_assignment)
    
    # Update activity log with the new assignment ID
    activity_log.entity_id = new_assignment.id
    db.commit()
    
    return new_assignment

@router.put("/vehicle-schedules/{assignment_id}", response_model=schemas.VehicleMaintenanceSchedule, summary="Update a maintenance schedule assignment")
async def update_maintenance_assignment(
    assignment_id: int,
    assignment_update: schemas.VehicleMaintenanceScheduleUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(check_technician)
):
    """
    Update a vehicle maintenance schedule assignment (requires technician role or higher).
    """
    # Get existing assignment
    db_assignment = db.query(models.VehicleMaintenanceSchedule).filter(
        models.VehicleMaintenanceSchedule.id == assignment_id
    ).first()
    
    if db_assignment is None:
        raise HTTPException(status_code=404, detail="Maintenance schedule assignment not found")
    
    # Get vehicle and schedule for calculations
    vehicle = db.query(models.Vehicle).filter(
        models.Vehicle.vehicle_id == db_assignment.vehicle_id
    ).first()
    
    schedule = db.query(models.MaintenanceSchedule).filter(
        models.MaintenanceSchedule.schedule_id == db_assignment.schedule_id
    ).first()
    
    # Update assignment attributes
    update_data = assignment_update.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_assignment, key, value)
    
    # Recalculate next due dates/values if last performed values were updated
    # Check if last_performed_date was updated
    if "last_performed_date" in update_data and schedule.is_time_based and schedule.time_interval_days:
        db_assignment.next_due_date = db_assignment.last_performed_date + timedelta(days=schedule.time_interval_days)
    
    # Check if last_performed_mileage was updated
    if "last_performed_mileage" in update_data and schedule.is_mileage_based and schedule.mileage_interval:
        db_assignment.next_due_mileage = db_assignment.last_performed_mileage + schedule.mileage_interval
    
    # Check if last_performed_engine_hours was updated
    if "last_performed_engine_hours" in update_data and schedule.is_engine_hours_based and schedule.engine_hours_interval:
        db_assignment.next_due_engine_hours = db_assignment.last_performed_engine_hours + schedule.engine_hours_interval
    
    db_assignment.updated_at = datetime.utcnow()
    
    # Log activity
    activity_log = models.ActivityLog(
        user_id=current_user.user_id,
        action="UPDATE",
        entity_type="VEHICLE_MAINTENANCE_SCHEDULE",
        entity_id=db_assignment.id,
        details=f"Updated maintenance schedule assignment for {vehicle.make} {vehicle.model} ({vehicle.vin})"
    )
    db.add(activity_log)
    
    db.commit()
    db.refresh(db_assignment)
    
    return db_assignment

@router.delete("/vehicle-schedules/{assignment_id}", status_code=status.HTTP_204_NO_CONTENT, summary="Delete a maintenance schedule assignment")
async def delete_maintenance_assignment(
    assignment_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(check_technician)
):
    """
    Delete a vehicle maintenance schedule assignment (requires technician role or higher).
    """
    # Get existing assignment
    db_assignment = db.query(models.VehicleMaintenanceSchedule).filter(
        models.VehicleMaintenanceSchedule.id == assignment_id
    ).first()
    
    if db_assignment is None:
        raise HTTPException(status_code=404, detail="Maintenance schedule assignment not found")
    
    # Get vehicle and schedule for logging
    vehicle = db.query(models.Vehicle).filter(
        models.Vehicle.vehicle_id == db_assignment.vehicle_id
    ).first()
    
    schedule = db.query(models.MaintenanceSchedule).filter(
        models.MaintenanceSchedule.schedule_id == db_assignment.schedule_id
    ).first()
    
    # Delete the assignment
    db.delete(db_assignment)
    
    # Log activity
    activity_log = models.ActivityLog(
        user_id=current_user.user_id,
        action="DELETE",
        entity_type="VEHICLE_MAINTENANCE_SCHEDULE",
        entity_id=assignment_id,
        details=f"Removed maintenance schedule '{schedule.name}' from vehicle {vehicle.make} {vehicle.model} ({vehicle.vin})"
    )
    db.add(activity_log)
    
    db.commit()
    
    return None

@router.post("/complete/{assignment_id}", response_model=schemas.VehicleMaintenanceSchedule, summary="Complete a maintenance task")
async def complete_maintenance(
    assignment_id: int,
    completion: schemas.MaintenanceCompletion,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(check_technician)
):
    """
    Mark a maintenance task as completed and update the next due date (requires technician role or higher).
    """
    # Get existing assignment
    db_assignment = db.query(models.VehicleMaintenanceSchedule).filter(
        models.VehicleMaintenanceSchedule.id == assignment_id
    ).first()
    
    if db_assignment is None:
        raise HTTPException(status_code=404, detail="Maintenance schedule assignment not found")
    
    # Get vehicle and schedule
    vehicle = db.query(models.Vehicle).filter(
        models.Vehicle.vehicle_id == db_assignment.vehicle_id
    ).first()
    
    schedule = db.query(models.MaintenanceSchedule).filter(
        models.MaintenanceSchedule.schedule_id == db_assignment.schedule_id
    ).first()
    
    # Update last performed values
    db_assignment.last_performed_date = completion.completion_date or datetime.utcnow()
    
    if completion.current_mileage:
        db_assignment.last_performed_mileage = completion.current_mileage
        # Also update vehicle mileage if it's higher than current
        if not vehicle.mileage or completion.current_mileage > vehicle.mileage:
            vehicle.mileage = completion.current_mileage
    else:
        db_assignment.last_performed_mileage = vehicle.mileage
    
    if completion.current_engine_hours:
        db_assignment.last_performed_engine_hours = completion.current_engine_hours
        # Also update vehicle engine hours if it's higher than current
        if not vehicle.engine_hours or completion.current_engine_hours > vehicle.engine_hours:
            vehicle.engine_hours = completion.current_engine_hours
    else:
        db_assignment.last_performed_engine_hours = vehicle.engine_hours
    
    # Calculate next due dates/values
    if schedule.is_time_based and schedule.time_interval_days:
        db_assignment.next_due_date = db_assignment.last_performed_date + timedelta(days=schedule.time_interval_days)
    
    if schedule.is_mileage_based and schedule.mileage_interval:
        db_assignment.next_due_mileage = db_assignment.last_performed_mileage + schedule.mileage_interval
    
    if schedule.is_engine_hours_based and schedule.engine_hours_interval:
        db_assignment.next_due_engine_hours = db_assignment.last_performed_engine_hours + schedule.engine_hours_interval
    
    # Create work order if requested
    work_order_id = None
    if completion.create_work_order:
        work_order = models.WorkOrder(
            vehicle_id=vehicle.vehicle_id,
            status="Completed",
            priority="Medium",
            description=f"Completed maintenance: {schedule.name}",
            reported_issue=None,
            diagnosis=None,
            resolution=completion.notes,
            created_by=current_user.user_id,
            assigned_to=completion.technician_id,
            start_date=completion.completion_date or datetime.utcnow(),
            completed_date=completion.completion_date or datetime.utcnow()
        )
        db.add(work_order)
        db.flush()
        work_order_id = work_order.work_order_id
    
    # Update vehicle's last service date
    vehicle.last_service_date = completion.completion_date or datetime.utcnow()
    
    # Log activity
    activity_log = models.ActivityLog(
        user_id=current_user.user_id,
        action="COMPLETE",
        entity_type="MAINTENANCE",
        entity_id=db_assignment.id,
        details=(
            f"Completed maintenance '{schedule.name}' for vehicle {vehicle.make} {vehicle.model} ({vehicle.vin}). "
            f"Mileage: {db_assignment.last_performed_mileage}, "
            f"Engine Hours: {db_assignment.last_performed_engine_hours}"
        )
    )
    db.add(activity_log)
    
    db.commit()
    db.refresh(db_assignment)
    
    return db_assignment

@router.post("/sync-samsara", summary="Sync maintenance schedules with Samsara")
async def sync_samsara_maintenance(
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(check_technician)
):
    """
    Sync maintenance schedules and history with Samsara maintenance logs.
    This is an asynchronous operation that runs in the background.
    """
    # Add sync task to background tasks
    background_tasks.add_task(
        sync_samsara_maintenance_logs,
        db=db,
        created_by=current_user.user_id
    )
    
    return {
        "message": "Samsara maintenance log sync started in the background",
        "status": "processing"
    }

async def sync_samsara_maintenance_logs(db: Session, created_by: int):
    """
    Background task to sync maintenance logs from Samsara.
    """
    import httpx
    import os
    from sqlalchemy.orm import Session
    
    # Environment variable for Samsara API key
    SAMSARA_API_KEY = os.getenv("SAMSARA_API_KEY")
    SAMSARA_API_BASE_URL = "https://api.samsara.com/v1"
    
    if not SAMSARA_API_KEY:
        # Log error
        error_log = models.ActivityLog(
            user_id=created_by,
            action="ERROR",
            entity_type="SYSTEM",
            entity_id=0,
            details="Samsara maintenance sync error: API key not configured"
        )
        db.add(error_log)
        db.commit()
        return {"error": "Samsara API key not configured"}
    
    try:
        headers = {
            "Authorization": f"Bearer {SAMSARA_API_KEY}"
        }
        
        # Get vehicles with Samsara IDs
        vehicles = db.query(models.Vehicle).filter(
            models.Vehicle.samsara_id.isnot(None)
        ).all()
        
        results = []
        
        # For each vehicle, get maintenance logs
        for vehicle in vehicles:
            async with httpx.AsyncClient() as client:
                # Get maintenance logs for vehicle
                response = await client.get(
                    f"{SAMSARA_API_BASE_URL}/fleet/maintenance/dvirs",
                    headers=headers,
                    params={"vehicleId": vehicle.samsara_id}
                )
                
                if response.status_code != 200:
                    results.append({
                        "vehicle_id": vehicle.vehicle_id,
                        "error": f"Failed to get maintenance logs: {response.text}"
                    })
                    continue
                
                logs = response.json()
                
                # Process each maintenance log
                for log in logs.get("dvirs", []):
                    # Skip logs that aren't maintenance related
                    if "defects" not in log or not log["defects"]:
                        continue
                    
                    # Extract log date
                    log_date = datetime.fromtimestamp(log["inspectionTimeMs"] / 1000) if "inspectionTimeMs" in log else datetime.utcnow()
                    
                    # Check if this log has already been processed
                    existing_log = db.query(models.ActivityLog).filter(
                        models.ActivityLog.entity_type == "SAMSARA_MAINTENANCE",
                        models.ActivityLog.details.like(f"%Samsara Log ID: {log.get('id', '')}%")
                    ).first()
                    
                    if existing_log:
                        continue
                    
                    # Create a maintenance record for each defect
                    for defect in log["defects"]:
                        # Look for matching maintenance schedule
                        maintenance_name = defect.get("comment", "").strip()
                        if not maintenance_name:
                            maintenance_name = f"Defect: {defect.get('defectType', 'Unknown')}"
                        
                        schedule = db.query(models.MaintenanceSchedule).filter(
                            models.MaintenanceSchedule.name.ilike(f"%{maintenance_name}%")
                        ).first()
                        
                        # If no matching schedule, create one
                        if not schedule:
                            schedule = models.MaintenanceSchedule(
                                name=maintenance_name,
                                description=f"Auto-created from Samsara defect: {defect.get('defectType', 'Unknown')}",
                                is_time_based=True,
                                time_interval_days=90  # Default to 90 days
                            )
                            db.add(schedule)
                            db.flush()
                        
                        # Check if this vehicle has this maintenance schedule assigned
                        assignment = db.query(models.VehicleMaintenanceSchedule).filter(
                            models.VehicleMaintenanceSchedule.vehicle_id == vehicle.vehicle_id,
                            models.VehicleMaintenanceSchedule.schedule_id == schedule.schedule_id
                        ).first()
                        
                        if not assignment:
                            # Create new assignment
                            next_due_date = log_date + timedelta(days=schedule.time_interval_days or 90)
                            
                            assignment = models.VehicleMaintenanceSchedule(
                                vehicle_id=vehicle.vehicle_id,
                                schedule_id=schedule.schedule_id,
                                last_performed_date=log_date,
                                last_performed_mileage=vehicle.mileage,
                                last_performed_engine_hours=vehicle.engine_hours,
                                next_due_date=next_due_date,
                                next_due_mileage=None,
                                next_due_engine_hours=None
                            )
                            db.add(assignment)
                        else:
                            # Update existing assignment if log date is newer
                            if not assignment.last_performed_date or log_date > assignment.last_performed_date:
                                assignment.last_performed_date = log_date
                                assignment.last_performed_mileage = vehicle.mileage
                                assignment.last_performed_engine_hours = vehicle.engine_hours
                                
                                # Recalculate next due
                                if schedule.is_time_based and schedule.time_interval_days:
                                    assignment.next_due_date = log_date + timedelta(days=schedule.time_interval_days)
                        
                        # Log the sync
                        activity_log = models.ActivityLog(
                            user_id=created_by,
                            action="SYNC",
                            entity_type="SAMSARA_MAINTENANCE",
                            entity_id=assignment.id,
                            details=(
                                f"Synced maintenance from Samsara for vehicle {vehicle.make} {vehicle.model} ({vehicle.vin}). "
                                f"Service: {maintenance_name}, Date: {log_date}, "
                                f"Samsara Log ID: {log.get('id', 'Unknown')}"
                            )
                        )
                        db.add(activity_log)
                    
                    results.append({
                        "vehicle_id": vehicle.vehicle_id,
                        "vehicle_name": f"{vehicle.make} {vehicle.model}",
                        "samsara_id": vehicle.samsara_id,
                        "logs_processed": len(log["defects"]),
                        "date": log_date
                    })
                
        db.commit()
        
        # Final log entry for entire sync
        sync_log = models.ActivityLog(
            user_id=created_by,
            action="SYNC_COMPLETE",
            entity_type="SAMSARA_MAINTENANCE",
            entity_id=0,
            details=f"Completed Samsara maintenance log sync. Processed {len(results)} maintenance records."
        )
        db.add(sync_log)
        db.commit()
        
        return {"results": results}
    
    except Exception as e:
        # Log error
        error_log = models.ActivityLog(
            user_id=created_by,
            action="ERROR",
            entity_type="SYSTEM",
            entity_id=0,
            details=f"Samsara maintenance sync error: {str(e)}"
        )
        db.add(error_log)
        db.commit()
        
        return {"error": str(e)}