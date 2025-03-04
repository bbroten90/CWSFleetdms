# routers/work_orders.py
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc
from typing import List, Optional
from datetime import datetime

from App import models
from App import schemas
from App.database_module import get_db
from auth import get_current_active_user, check_technician, check_manager

router = APIRouter(
    prefix="/api/work-orders",
    tags=["work orders"],
    dependencies=[Depends(get_current_active_user)],
    responses={404: {"description": "Work order not found"}},
)

@router.get("/", response_model=List[schemas.WorkOrder], summary="Get all work orders")
async def get_work_orders(
    skip: int = 0, 
    limit: int = 100,
    status: Optional[str] = None,
    vehicle_id: Optional[int] = None,
    priority: Optional[str] = None,
    assigned_to: Optional[int] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """
    Get all work orders with optional filtering.
    """
    query = db.query(models.WorkOrder)
    
    # Apply filters if provided
    if status:
        query = query.filter(models.WorkOrder.status == status)
    if vehicle_id:
        query = query.filter(models.WorkOrder.vehicle_id == vehicle_id)
    if priority:
        query = query.filter(models.WorkOrder.priority == priority)
    if assigned_to:
        query = query.filter(models.WorkOrder.assigned_to == assigned_to)
    
    # Search functionality
    if search:
        search_term = f"%{search}%"
        query = query.filter(models.WorkOrder.description.ilike(search_term))
    
    # Get results with pagination, ordered by created_at descending (newest first)
    work_orders = query.order_by(desc(models.WorkOrder.created_at)).offset(skip).limit(limit).all()
    return work_orders

@router.get("/{work_order_id}", response_model=schemas.WorkOrder, summary="Get a specific work order")
async def get_work_order(
    work_order_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """
    Get a specific work order by ID.
    """
    work_order = db.query(models.WorkOrder).filter(models.WorkOrder.work_order_id == work_order_id).first()
    if work_order is None:
        raise HTTPException(status_code=404, detail="Work order not found")
    return work_order

@router.post("/", response_model=schemas.WorkOrder, status_code=status.HTTP_201_CREATED, summary="Create a new work order")
async def create_work_order(
    work_order: schemas.WorkOrderCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """
    Create a new work order.
    """
    # Check if vehicle exists
    vehicle = db.query(models.Vehicle).filter(models.Vehicle.vehicle_id == work_order.vehicle_id).first()
    if not vehicle:
        raise HTTPException(status_code=404, detail="Vehicle not found")
    
    # Check if assigned technician exists if provided
    if work_order.assigned_to:
        technician = db.query(models.Technician).filter(models.Technician.technician_id == work_order.assigned_to).first()
        if not technician:
            raise HTTPException(status_code=404, detail="Assigned technician not found")
    
    # Create new work order
    new_work_order = models.WorkOrder(
        **work_order.dict(),
        created_by=current_user.user_id
    )
    db.add(new_work_order)
    
    # Log activity
    activity_log = models.ActivityLog(
        user_id=current_user.user_id,
        action="CREATE",
        entity_type="WORK_ORDER",
        entity_id=0,  # Will be updated after commit
        details=f"Created work order for vehicle {vehicle.make} {vehicle.model} - {work_order.description}"
    )
    db.add(activity_log)
    
    db.commit()
    db.refresh(new_work_order)
    
    # Update activity log with the new work order ID
    activity_log.entity_id = new_work_order.work_order_id
    db.commit()
    
    return new_work_order

@router.put("/{work_order_id}", response_model=schemas.WorkOrder, summary="Update a work order")
async def update_work_order(
    work_order_id: int,
    work_order_update: schemas.WorkOrderUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """
    Update a work order's information.
    """
    # Get existing work order
    db_work_order = db.query(models.WorkOrder).filter(models.WorkOrder.work_order_id == work_order_id).first()
    if db_work_order is None:
        raise HTTPException(status_code=404, detail="Work order not found")
    
    # Check if assigned technician exists if being updated
    if work_order_update.assigned_to is not None:
        technician = db.query(models.Technician).filter(models.Technician.technician_id == work_order_update.assigned_to).first()
        if not technician and work_order_update.assigned_to is not None:
            raise HTTPException(status_code=404, detail="Assigned technician not found")
    
    # Handle status transitions
    if work_order_update.status and work_order_update.status != db_work_order.status:
        # Set start date when transitioning to In-progress
        if work_order_update.status == "In-progress" and db_work_order.status == "Open":
            work_order_update.start_date = datetime.utcnow()
        
        # Set completed date when transitioning to Completed
        if work_order_update.status == "Completed" and db_work_order.status != "Completed":
            work_order_update.completed_date = datetime.utcnow()
    
    # Update work order attributes
    update_data = work_order_update.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_work_order, key, value)
    
    db_work_order.updated_at = datetime.utcnow()
    
    # Log activity
    activity_log = models.ActivityLog(
        user_id=current_user.user_id,
        action="UPDATE",
        entity_type="WORK_ORDER",
        entity_id=db_work_order.work_order_id,
        details=f"Updated work order: {db_work_order.description}"
    )
    db.add(activity_log)
    
    db.commit()
    db.refresh(db_work_order)
    
    return db_work_order

@router.delete("/{work_order_id}", status_code=status.HTTP_204_NO_CONTENT, summary="Delete a work order")
async def delete_work_order(
    work_order_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(check_manager)  # Only managers can delete work orders
):
    """
    Delete a work order (requires manager role).
    """
    # Get existing work order
    db_work_order = db.query(models.WorkOrder).filter(models.WorkOrder.work_order_id == work_order_id).first()
    if db_work_order is None:
        raise HTTPException(status_code=404, detail="Work order not found")
    
    # Store work order info for logging
    work_order_info = f"{db_work_order.description} (ID: {db_work_order.work_order_id})"
    
    # Delete related tasks first
    db.query(models.WorkOrderTask).filter(models.WorkOrderTask.work_order_id == work_order_id).delete()
    
    # Delete related parts
    db.query(models.WorkOrderPart).filter(models.WorkOrderPart.work_order_id == work_order_id).delete()
    
    # Delete the work order
    db.delete(db_work_order)
    
    # Log activity
    activity_log = models.ActivityLog(
        user_id=current_user.user_id,
        action="DELETE",
        entity_type="WORK_ORDER",
        entity_id=work_order_id,
        details=f"Deleted work order: {work_order_info}"
    )
    db.add(activity_log)
    
    db.commit()
    
    return None

@router.get("/{work_order_id}/tasks", response_model=List[schemas.WorkOrderTask], summary="Get work order tasks")
async def get_work_order_tasks(
    work_order_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """
    Get all tasks for a specific work order.
    """
    # Check if work order exists
    work_order = db.query(models.WorkOrder).filter(models.WorkOrder.work_order_id == work_order_id).first()
    if work_order is None:
        raise HTTPException(status_code=404, detail="Work order not found")
    
    # Get tasks
    tasks = db.query(models.WorkOrderTask).filter(
        models.WorkOrderTask.work_order_id == work_order_id
    ).all()
    
    return tasks

@router.post("/{work_order_id}/tasks", response_model=schemas.WorkOrderTask, summary="Add a task to a work order")
async def add_work_order_task(
    work_order_id: int,
    task: schemas.WorkOrderTaskCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """
    Add a new task to an existing work order.
    """
    # Check if work order exists
    work_order = db.query(models.WorkOrder).filter(models.WorkOrder.work_order_id == work_order_id).first()
    if work_order is None:
        raise HTTPException(status_code=404, detail="Work order not found")
    
    # Check if technician exists if provided
    if task.technician_id:
        technician = db.query(models.Technician).filter(models.Technician.technician_id == task.technician_id).first()
        if not technician:
            raise HTTPException(status_code=404, detail="Technician not found")
    
    # Create new task
    new_task = models.WorkOrderTask(
        work_order_id=work_order_id,
        **task.dict()
    )
    db.add(new_task)
    
    # Log activity
    activity_log = models.ActivityLog(
        user_id=current_user.user_id,
        action="CREATE",
        entity_type="WORK_ORDER_TASK",
        entity_id=work_order_id,
        details=f"Added task to work order: {task.description}"
    )
    db.add(activity_log)
    
    db.commit()
    db.refresh(new_task)
    
    return new_task

@router.put("/{work_order_id}/tasks/{task_id}", response_model=schemas.WorkOrderTask, summary="Update a work order task")
async def update_work_order_task(
    work_order_id: int,
    task_id: int,
    task_update: schemas.WorkOrderTaskUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """
    Update a task in a work order.
    """
    # Check if work order exists
    work_order = db.query(models.WorkOrder).filter(models.WorkOrder.work_order_id == work_order_id).first()
    if work_order is None:
        raise HTTPException(status_code=404, detail="Work order not found")
    
    # Check if task exists
    task = db.query(models.WorkOrderTask).filter(
        models.WorkOrderTask.task_id == task_id,
        models.WorkOrderTask.work_order_id == work_order_id
    ).first()
    if task is None:
        raise HTTPException(status_code=404, detail="Task not found")
    
    # Check if technician exists if being updated
    if task_update.technician_id is not None:
        technician = db.query(models.Technician).filter(models.Technician.technician_id == task_update.technician_id).first()
        if not technician and task_update.technician_id is not None:
            raise HTTPException(status_code=404, detail="Technician not found")
    
    # Handle status transitions
    if task_update.status and task_update.status != task.status:
        # Set completed date when transitioning to Completed
        if task_update.status == "Completed" and task.status != "Completed":
            task_update.completed_date = datetime.utcnow()
    
    # Update task attributes
    update_data = task_update.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(task, key, value)
    
    # Log activity
    activity_log = models.ActivityLog(
        user_id=current_user.user_id,
        action="UPDATE",
        entity_type="WORK_ORDER_TASK",
        entity_id=task.task_id,
        details=f"Updated task in work order: {task.description}"
    )
    db.add(activity_log)
    
    db.commit()
    db.refresh(task)
    
    return task

@router.delete("/{work_order_id}/tasks/{task_id}", status_code=status.HTTP_204_NO_CONTENT, summary="Delete a work order task")
async def delete_work_order_task(
    work_order_id: int,
    task_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """
    Delete a task from a work order.
    """
    # Check if work order exists
    work_order = db.query(models.WorkOrder).filter(models.WorkOrder.work_order_id == work_order_id).first()
    if work_order is None:
        raise HTTPException(status_code=404, detail="Work order not found")
    
    # Check if task exists
    task = db.query(models.WorkOrderTask).filter(
        models.WorkOrderTask.task_id == task_id,
        models.WorkOrderTask.work_order_id == work_order_id
    ).first()
    if task is None:
        raise HTTPException(status_code=404, detail="Task not found")
    
    # Store task info for logging
    task_info = task.description
    
    # Delete the task
    db.delete(task)
    
    # Log activity
    activity_log = models.ActivityLog(
        user_id=current_user.user_id,
        action="DELETE",
        entity_type="WORK_ORDER_TASK",
        entity_id=task_id,
        details=f"Deleted task from work order: {task_info}"
    )
    db.add(activity_log)
    
    db.commit()
    
    return None

@router.get("/{work_order_id}/parts", response_model=List[schemas.WorkOrderPartWithDetails], summary="Get work order parts")
async def get_work_order_parts(
    work_order_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """
    Get all parts used in a specific work order.
    """
    # Check if work order exists
    work_order = db.query(models.WorkOrder).filter(models.WorkOrder.work_order_id == work_order_id).first()
    if work_order is None:
        raise HTTPException(status_code=404, detail="Work order not found")
    
    # Get parts with join to parts inventory for details
    parts = db.query(models.WorkOrderPart, models.PartsInventory).join(
        models.PartsInventory, 
        models.WorkOrderPart.part_id == models.PartsInventory.part_id
    ).filter(
        models.WorkOrderPart.work_order_id == work_order_id
    ).all()
    
    # Format response
    result = []
    for work_order_part, part in parts:
        result.append({
            "id": work_order_part.id,
            "work_order_id": work_order_part.work_order_id,
            "part_id": work_order_part.part_id,
            "quantity": work_order_part.quantity,
            "unit_cost": work_order_part.unit_cost,
            "created_at": work_order_part.created_at,
            "updated_at": work_order_part.updated_at,
            "part": {
                "part_id": part.part_id,
                "part_number": part.part_number,
                "name": part.name,
                "category": part.category,
                "location": part.location,
                "quantity_on_hand": part.quantity_on_hand
            }
        })
    
    return result

@router.post("/{work_order_id}/parts", response_model=schemas.WorkOrderPart, summary="Add a part to a work order")
async def add_work_order_part(
    work_order_id: int,
    part: schemas.WorkOrderPartCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """
    Add a part to a work order and update inventory.
    """
    # Check if work order exists
    work_order = db.query(models.WorkOrder).filter(models.WorkOrder.work_order_id == work_order_id).first()
    if work_order is None:
        raise HTTPException(status_code=404, detail="Work order not found")
    
    # Check if part exists
    inventory_part = db.query(models.PartsInventory).filter(models.PartsInventory.part_id == part.part_id).first()
    if inventory_part is None:
        raise HTTPException(status_code=404, detail="Part not found in inventory")
    
    # Check if there's enough quantity
    if inventory_part.quantity_on_hand < part.quantity:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Not enough parts in inventory. Available: {inventory_part.quantity_on_hand}, Requested: {part.quantity}"
        )
    
    # Create new work order part
    new_part = models.WorkOrderPart(
        work_order_id=work_order_id,
        part_id=part.part_id,
        quantity=part.quantity,
        unit_cost=part.unit_cost or inventory_part.unit_cost
    )
    db.add(new_part)
    
    # Update inventory quantity
    inventory_part.quantity_on_hand -= part.quantity
    
    # Log activity
    activity_log = models.ActivityLog(
        user_id=current_user.user_id,
        action="CREATE",
        entity_type="WORK_ORDER_PART",
        entity_id=work_order_id,
        details=f"Added {part.quantity} {inventory_part.name} to work order"
    )
    db.add(activity_log)
    
    db.commit()
    db.refresh(new_part)
    
    return new_part

@router.delete("/{work_order_id}/parts/{part_id}", status_code=status.HTTP_204_NO_CONTENT, summary="Remove a part from a work order")
async def remove_work_order_part(
    work_order_id: int,
    part_id: int,
    restore_inventory: bool = True,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(check_technician)
):
    """
    Remove a part from a work order and optionally restore inventory.
    """
    # Check if work order exists
    work_order = db.query(models.WorkOrder).filter(models.WorkOrder.work_order_id == work_order_id).first()
    if work_order is None:
        raise HTTPException(status_code=404, detail="Work order not found")
    
    # Check if work order part exists
    work_order_part = db.query(models.WorkOrderPart).filter(
        models.WorkOrderPart.id == part_id,
        models.WorkOrderPart.work_order_id == work_order_id
    ).first()
    if work_order_part is None:
        raise HTTPException(status_code=404, detail="Part not found in this work order")
    
    # Get inventory part
    inventory_part = db.query(models.PartsInventory).filter(
        models.PartsInventory.part_id == work_order_part.part_id
    ).first()
    
    # Store info for logging
    part_info = f"{work_order_part.quantity} of part ID {work_order_part.part_id}"
    
    # Restore inventory if requested and part still exists
    if restore_inventory and inventory_part:
        inventory_part.quantity_on_hand += work_order_part.quantity
    
    # Delete the work order part
    db.delete(work_order_part)
    
    # Log activity
    activity_log = models.ActivityLog(
        user_id=current_user.user_id,
        action="DELETE",
        entity_type="WORK_ORDER_PART",
        entity_id=part_id,
        details=f"Removed {part_info} from work order" + 
                (f" and restored to inventory" if restore_inventory else "")
    )
    db.add(activity_log)
    
    db.commit()
    
    return None
