# routers/parts.py
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime

import models
import schemas
from database import get_db
from auth import get_current_active_user, check_technician, check_manager

router = APIRouter(
    prefix="/api/parts",
    tags=["parts"],
    dependencies=[Depends(get_current_active_user)],
    responses={404: {"description": "Part not found"}},
)

@router.get("/", response_model=List[schemas.PartsInventory], summary="Get all parts inventory")
async def get_parts(
    skip: int = 0, 
    limit: int = 100,
    category: Optional[str] = None,
    low_stock: Optional[bool] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """
    Get all parts with optional filtering.
    """
    query = db.query(models.PartsInventory)
    
    # Apply filters if provided
    if category:
        query = query.filter(models.PartsInventory.category == category)
    
    if low_stock:
        query = query.filter(
            models.PartsInventory.quantity_on_hand <= models.PartsInventory.minimum_quantity
        )
    
    # Search functionality
    if search:
        search_term = f"%{search}%"
        query = query.filter(
            models.PartsInventory.part_number.ilike(search_term) |
            models.PartsInventory.name.ilike(search_term) |
            models.PartsInventory.description.ilike(search_term) |
            models.PartsInventory.manufacturer.ilike(search_term)
        )
    
    # Get results with pagination
    parts = query.order_by(models.PartsInventory.name).offset(skip).limit(limit).all()
    return parts

@router.get("/{part_id}", response_model=schemas.PartsInventory, summary="Get a specific part")
async def get_part(
    part_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """
    Get a specific part by ID.
    """
    part = db.query(models.PartsInventory).filter(models.PartsInventory.part_id == part_id).first()
    if part is None:
        raise HTTPException(status_code=404, detail="Part not found")
    return part

@router.post("/", response_model=schemas.PartsInventory, status_code=status.HTTP_201_CREATED, summary="Create a new part")
async def create_part(
    part: schemas.PartsInventoryCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(check_technician)
):
    """
    Create a new part in inventory (requires technician role or higher).
    """
    # Check if part with same part number already exists
    existing_part = db.query(models.PartsInventory).filter(
        models.PartsInventory.part_number == part.part_number
    ).first()
    
    if existing_part:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Part with part number {part.part_number} already exists"
        )
    
    # Create new part
    new_part = models.PartsInventory(**part.dict())
    db.add(new_part)
    
    # Log activity
    activity_log = models.ActivityLog(
        user_id=current_user.user_id,
        action="CREATE",
        entity_type="PART",
        entity_id=0,  # Will be updated after commit
        details=f"Created new part: {part.name} (PN: {part.part_number})"
    )
    db.add(activity_log)
    
    db.commit()
    db.refresh(new_part)
    
    # Update activity log with the new part ID
    activity_log.entity_id = new_part.part_id
    db.commit()
    
    return new_part

@router.put("/{part_id}", response_model=schemas.PartsInventory, summary="Update a part")
async def update_part(
    part_id: int,
    part_update: schemas.PartsInventoryUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(check_technician)
):
    """
    Update a part's information (requires technician role or higher).
    """
    # Get existing part
    db_part = db.query(models.PartsInventory).filter(models.PartsInventory.part_id == part_id).first()
    if db_part is None:
        raise HTTPException(status_code=404, detail="Part not found")
    
    # Check if updating part number and if it already exists
    if part_update.part_number and part_update.part_number != db_part.part_number:
        existing_part = db.query(models.PartsInventory).filter(
            models.PartsInventory.part_number == part_update.part_number,
            models.PartsInventory.part_id != part_id
        ).first()
        
        if existing_part:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Part with part number {part_update.part_number} already exists"
            )
    
    # Update part attributes
    update_data = part_update.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_part, key, value)
    
    db_part.updated_at = datetime.utcnow()
    
    # Log activity
    activity_log = models.ActivityLog(
        user_id=current_user.user_id,
        action="UPDATE",
        entity_type="PART",
        entity_id=db_part.part_id,
        details=f"Updated part: {db_part.name} (PN: {db_part.part_number})"
    )
    db.add(activity_log)
    
    db.commit()
    db.refresh(db_part)
    
    return db_part

@router.delete("/{part_id}", status_code=status.HTTP_204_NO_CONTENT, summary="Delete a part")
async def delete_part(
    part_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(check_manager)  # Only managers can delete parts
):
    """
    Delete a part from inventory (requires manager role).
    """
    # Get existing part
    db_part = db.query(models.PartsInventory).filter(models.PartsInventory.part_id == part_id).first()
    if db_part is None:
        raise HTTPException(status_code=404, detail="Part not found")
    
    # Check if part is used in any work orders
    work_order_parts = db.query(models.WorkOrderPart).filter(
        models.WorkOrderPart.part_id == part_id
    ).first()
    
    if work_order_parts:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete part that is used in work orders. Update the quantity to zero instead."
        )
    
    # Store part info for logging
    part_info = f"{db_part.name} (PN: {db_part.part_number})"
    
    # Delete the part
    db.delete(db_part)
    
    # Log activity
    activity_log = models.ActivityLog(
        user_id=current_user.user_id,
        action="DELETE",
        entity_type="PART",
        entity_id=part_id,
        details=f"Deleted part: {part_info}"
    )
    db.add(activity_log)
    
    db.commit()
    
    return None

@router.post("/{part_id}/adjust", response_model=schemas.PartsInventory, summary="Adjust part inventory")
async def adjust_inventory(
    part_id: int,
    adjustment: schemas.InventoryAdjustment,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(check_technician)
):
    """
    Adjust the quantity of a part in inventory (requires technician role or higher).
    """
    # Get existing part
    db_part = db.query(models.PartsInventory).filter(models.PartsInventory.part_id == part_id).first()
    if db_part is None:
        raise HTTPException(status_code=404, detail="Part not found")
    
    # Calculate new quantity
    old_quantity = db_part.quantity_on_hand
    
    if adjustment.adjustment_type == "set":
        db_part.quantity_on_hand = adjustment.quantity
    elif adjustment.adjustment_type == "add":
        db_part.quantity_on_hand += adjustment.quantity
    elif adjustment.adjustment_type == "subtract":
        if db_part.quantity_on_hand < adjustment.quantity:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Not enough quantity in inventory. Current: {db_part.quantity_on_hand}, Requested: {adjustment.quantity}"
            )
        db_part.quantity_on_hand -= adjustment.quantity
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid adjustment type. Must be 'set', 'add', or 'subtract'."
        )
    
    # Update unit cost if provided
    if adjustment.unit_cost:
        db_part.unit_cost = adjustment.unit_cost
    
    # Log activity
    activity_log = models.ActivityLog(
        user_id=current_user.user_id,
        action="INVENTORY_ADJUST",
        entity_type="PART",
        entity_id=db_part.part_id,
        details=(
            f"Adjusted inventory for {db_part.name} (PN: {db_part.part_number}). "
            f"Old quantity: {old_quantity}, New quantity: {db_part.quantity_on_hand}, "
            f"Adjustment: {adjustment.adjustment_type} {adjustment.quantity}, "
            f"Reason: {adjustment.reason or 'Not specified'}"
        )
    )
    db.add(activity_log)
    
    db.commit()
    db.refresh(db_part)
    
    return db_part

@router.get("/categories", response_model=List[str], summary="Get all part categories")
async def get_part_categories(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """
    Get a list of all unique part categories.
    """
    categories = db.query(models.PartsInventory.category).distinct().filter(
        models.PartsInventory.category.isnot(None)
    ).all()
    
    # Extract values from tuples
    category_list = [cat[0] for cat in categories if cat[0]]
    return sorted(category_list)

@router.get("/usage-stats", summary="Get part usage statistics")
async def get_part_usage_stats(
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    top_count: int = 10,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """
    Get usage statistics for parts in work orders.
    """
    from sqlalchemy import func, desc
    
    query = db.query(
        models.WorkOrderPart.part_id,
        models.PartsInventory.part_number,
        models.PartsInventory.name,
        func.sum(models.WorkOrderPart.quantity).label("total_used"),
        func.count(models.WorkOrderPart.work_order_id.distinct()).label("work_order_count"),
        func.avg(models.WorkOrderPart.unit_cost).label("average_cost")
    ).join(
        models.PartsInventory,
        models.WorkOrderPart.part_id == models.PartsInventory.part_id
    )
    
    # Apply date filters if provided
    if start_date:
        query = query.filter(models.WorkOrderPart.created_at >= start_date)
    if end_date:
        query = query.filter(models.WorkOrderPart.created_at <= end_date)
    
    # Group by part and order by usage
    stats = query.group_by(
        models.WorkOrderPart.part_id,
        models.PartsInventory.part_number,
        models.PartsInventory.name
    ).order_by(desc("total_used")).limit(top_count).all()
    
    # Format results
    result = []
    for stat in stats:
        result.append({
            "part_id": stat.part_id,
            "part_number": stat.part_number,
            "name": stat.name,
            "total_used": stat.total_used,
            "work_order_count": stat.work_order_count,
            "average_cost": float(stat.average_cost) if stat.average_cost else None
        })
    
    return {
        "stats": result,
        "date_range": {
            "start_date": start_date,
            "end_date": end_date
        }
    }
    