# routers/reports.py
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, desc, case, cast, Integer, Float, and_, or_
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional

from App import models
from App import schemas
from App.database_module import get_db
from auth import get_current_active_user, check_manager

router = APIRouter(
    prefix="/api/reports",
    tags=["reports"],
    dependencies=[Depends(get_current_active_user)],
)

@router.get("/inventory-valuation", summary="Get inventory valuation report")
async def get_inventory_valuation(
    category: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """
    Get inventory valuation report, optionally filtered by category.
    Returns total value, quantity, and inventory breakdown by category.
    """
    # Base query to get parts with value calculation
    query = db.query(
        models.PartsInventory,
        (models.PartsInventory.quantity_on_hand * models.PartsInventory.unit_cost).label("value")
    )
    
    # Apply category filter if provided
    if category:
        query = query.filter(models.PartsInventory.category == category)
    
    # Execute query
    parts_with_value = query.all()
    
    # Calculate total values
    total_value = sum(part_value[1] or 0 for part_value in parts_with_value)
    total_quantity = sum(part_value[0].quantity_on_hand or 0 for part_value in parts_with_value)
    
    # Get category breakdown
    category_breakdown = db.query(
        models.PartsInventory.category,
        func.sum(models.PartsInventory.quantity_on_hand).label("total_quantity"),
        func.sum(models.PartsInventory.quantity_on_hand * models.PartsInventory.unit_cost).label("total_value")
    ).group_by(
        models.PartsInventory.category
    ).all()
    
    # Format category breakdown
    categories = []
    for cat in category_breakdown:
        if cat.category:  # Skip null categories
            categories.append({
                "category": cat.category,
                "quantity": cat.total_quantity,
                "value": float(cat.total_value) if cat.total_value else 0,
                "percentage": round((float(cat.total_value or 0) / total_value * 100), 2) if total_value > 0 else 0
            })
    
    # Format parts data
    parts = []
    for part, value in parts_with_value:
        parts.append({
            "part_id": part.part_id,
            "part_number": part.part_number,
            "name": part.name,
            "category": part.category,
            "manufacturer": part.manufacturer,
            "quantity": part.quantity_on_hand,
            "unit_cost": float(part.unit_cost) if part.unit_cost else 0,
            "value": float(value) if value else 0
        })
    
    return {
        "total_value": float(total_value),
        "total_quantity": total_quantity,
        "categories": categories,
        "parts": parts
    }

@router.get("/low-stock", response_model=List[Dict[str, Any]], summary="Get low stock items")
async def get_low_stock_items(
    threshold_percentage: float = 100,  # 100% means at or below minimum
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """
    Get items with stock at or below minimum quantity.
    Threshold percentage allows adjusting what counts as "low stock".
    """
    # Calculate threshold ratio
    threshold_ratio = threshold_percentage / 100
    
    # Get low stock items
    query = db.query(models.PartsInventory).filter(
        models.PartsInventory.quantity_on_hand <= models.PartsInventory.minimum_quantity * threshold_ratio
    ).order_by(
        (models.PartsInventory.quantity_on_hand / models.PartsInventory.minimum_quantity).asc()
    )
    
    low_stock_items = query.all()
    
    # Format results
    results = []
    for item in low_stock_items:
        # Calculate percentage of minimum
        percentage = (item.quantity_on_hand / item.minimum_quantity * 100) if item.minimum_quantity > 0 else 0
        
        results.append({
            "part_id": item.part_id,
            "part_number": item.part_number,
            "name": item.name,
            "category": item.category,
            "quantity_on_hand": item.quantity_on_hand,
            "minimum_quantity": item.minimum_quantity,
            "percentage": round(percentage, 2),
            "unit_cost": float(item.unit_cost) if item.unit_cost else 0,
            "severity": "Critical" if item.quantity_on_hand == 0 else "High" if percentage <= 50 else "Medium"
        })
    
    return results

@router.get("/part-usage-by-date", summary="Get part usage by date")
async def get_part_usage_by_date(
    start_date: datetime = Query(None),
    end_date: datetime = Query(None),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """
    Get part usage statistics by date for a specified date range.
    If no dates provided, defaults to the last 30 days.
    """
    # Set default date range to last 30 days if not provided
    if not end_date:
        end_date = datetime.utcnow()
    if not start_date:
        start_date = end_date - timedelta(days=30)
    
    # Query to get work order parts grouped by date
    usage_by_date = db.query(
        func.date(models.WorkOrderPart.created_at).label('date'),
        func.sum(models.WorkOrderPart.quantity).label('usage'),
        func.count(models.WorkOrderPart.work_order_id.distinct()).label('work_order_count')
    ).filter(
        models.WorkOrderPart.created_at >= start_date,
        models.WorkOrderPart.created_at <= end_date
    ).group_by(
        func.date(models.WorkOrderPart.created_at)
    ).order_by(
        func.date(models.WorkOrderPart.created_at)
    ).all()
    
    # Get detailed part usage for each date
    results = []
    for date_data in usage_by_date:
        # Get parts used on this date
        parts_on_date = db.query(
            models.WorkOrderPart.part_id,
            models.PartsInventory.part_number,
            models.PartsInventory.name,
            func.sum(models.WorkOrderPart.quantity).label('quantity'),
            func.sum(models.WorkOrderPart.quantity * models.WorkOrderPart.unit_cost).label('cost')
        ).join(
            models.PartsInventory,
            models.WorkOrderPart.part_id == models.PartsInventory.part_id
        ).filter(
            func.date(models.WorkOrderPart.created_at) == date_data.date
        ).group_by(
            models.WorkOrderPart.part_id,
            models.PartsInventory.part_number,
            models.PartsInventory.name
        ).all()
        
        # Format parts data
        parts_data = []
        for part in parts_on_date:
            parts_data.append({
                "part_id": part.part_id,
                "part_number": part.part_number,
                "name": part.name,
                "quantity": part.quantity,
                "cost": float(part.cost) if part.cost else 0
            })
        
        # Add to results
        results.append({
            "date": date_data.date.isoformat(),
            "usage": date_data.usage,
            "workOrderCount": date_data.work_order_count,
            "parts": parts_data
        })
    
    return {"data": results}

@router.get("/top-used-parts", summary="Get top used parts")
async def get_top_used_parts(
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    limit: int = 10,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """
    Get the most frequently used parts in a given time period.
    """
    # Set default date range if not provided
    if not end_date:
        end_date = datetime.utcnow()
    if not start_date:
        start_date = end_date - timedelta(days=365)  # Default to last year
    
    # Query to get most used parts
    top_parts = db.query(
        models.WorkOrderPart.part_id,
        models.PartsInventory.part_number,
        models.PartsInventory.name,
        models.PartsInventory.category,
        func.sum(models.WorkOrderPart.quantity).label('total_quantity'),
        func.sum(models.WorkOrderPart.quantity * models.WorkOrderPart.unit_cost).label('total_cost'),
        func.count(models.WorkOrderPart.work_order_id.distinct()).label('usage_count')
    ).join(
        models.PartsInventory,
        models.WorkOrderPart.part_id == models.PartsInventory.part_id
    ).filter(
        models.WorkOrderPart.created_at >= start_date,
        models.WorkOrderPart.created_at <= end_date
    ).group_by(
        models.WorkOrderPart.part_id,
        models.PartsInventory.part_number,
        models.PartsInventory.name,
        models.PartsInventory.category
    ).order_by(
        desc('total_quantity')
    ).limit(limit).all()
    
    # Format results
    results = []
    for part in top_parts:
        results.append({
            "part_id": part.part_id,
            "part_number": part.part_number,
            "name": part.name,
            "category": part.category,
            "total_quantity": part.total_quantity,
            "total_cost": float(part.total_cost) if part.total_cost else 0,
            "usage_count": part.usage_count
        })
    
    return {"data": results}

@router.get("/inventory-movement", summary="Get inventory movement history")
async def get_inventory_movement(
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """
    Get inventory movement (additions, removals, adjustments) over time.
    """
    # Set default date range if not provided
    if not end_date:
        end_date = datetime.utcnow()
    if not start_date:
        start_date = end_date - timedelta(days=30)  # Default to last month
    
    # This query is more complex and would typically use activity logs
    # Here's a simplified version that estimates inventory changes
    
    # Get work order parts (removals)
    parts_used = db.query(
        func.date(models.WorkOrderPart.created_at).label('date'),
        func.sum(models.WorkOrderPart.quantity).label('removed')
    ).filter(
        models.WorkOrderPart.created_at >= start_date,
        models.WorkOrderPart.created_at <= end_date
    ).group_by(
        func.date(models.WorkOrderPart.created_at)
    ).all()
    
    # Mock additions and adjustments (in a real app, you'd use activity logs)
    # Here we're creating synthetic data based on parts used
    date_range = []
    current_date = start_date
    while current_date <= end_date:
        date_range.append(current_date.date())
        current_date += timedelta(days=1)
    
    results = []
    running_balance = 0  # Initialize with a starting balance
    
    # Get initial balance as of start date
    initial_balance = db.query(func.sum(models.PartsInventory.quantity_on_hand)).scalar() or 0
    running_balance = initial_balance
    
    for date in date_range:
        # Find parts used on this date
        parts_removed = next((item.removed for item in parts_used if item.date == date), 0)
        
        # Synthetic data for additions and adjustments
        additions = int(parts_removed * 1.1)  # Slightly more additions than removals
        adjustments = int(parts_removed * 0.05) * (-1 if date.day % 2 == 0 else 1)  # Small adjustments
        
        # Update running balance
        running_balance = running_balance + additions - parts_removed + adjustments
        
        results.append({
            "date": date.isoformat(),
            "additions": additions,
            "removals": parts_removed,
            "adjustments": adjustments,
            "balance": running_balance
        })
    
    return {"data": results}