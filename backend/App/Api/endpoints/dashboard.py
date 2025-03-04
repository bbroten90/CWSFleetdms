# routers/dashboard.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func, and_, or_
from datetime import datetime, timedelta
from typing import List

import models
import schemas
from database import get_db
from auth import get_current_active_user

router = APIRouter(
    prefix="/api/dashboard",
    tags=["dashboard"],
    dependencies=[Depends(get_current_active_user)],
)

@router.get("/summary", response_model=schemas.DashboardSummary, summary="Get dashboard summary")
async def get_dashboard_summary(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """
    Get summary statistics for the dashboard.
    """
    # Get vehicle counts
    total_vehicles = db.query(func.count(models.Vehicle.vehicle_id)).scalar() or 0
    active_vehicles = db.query(func.count(models.Vehicle.vehicle_id)).filter(
        models.Vehicle.status == "Active"
    ).scalar() or 0
    out_of_service_vehicles = db.query(func.count(models.Vehicle.vehicle_id)).filter(
        models.Vehicle.status == "Out-of-service"
    ).scalar() or 0
    
    # Get work order counts
    open_work_orders = db.query(func.count(models.WorkOrder.work_order_id)).filter(
        models.WorkOrder.status.in_(["Open", "In-progress"])
    ).scalar() or 0
    critical_work_orders = db.query(func.count(models.WorkOrder.work_order_id)).filter(
        models.WorkOrder.status.in_(["Open", "In-progress"]),
        models.WorkOrder.priority == "Critical"
    ).scalar() or 0
    
    # Get inventory alerts
    low_inventory_items = db.query(func.count(models.PartsInventory.part_id)).filter(
        models.PartsInventory.quantity_on_hand <= models.PartsInventory.minimum_quantity
    ).scalar() or 0
    
    # Get maintenance due count
    maintenance_due_count = db.query(func.count(models.VehicleMaintenanceSchedule.id)).filter(
        or_(
            and_(
                models.VehicleMaintenanceSchedule.next_due_date.isnot(None),
                models.VehicleMaintenanceSchedule.next_due_date <= datetime.utcnow()
            ),
            and_(
                models.MaintenanceSchedule.is_mileage_based == True,
                models.VehicleMaintenanceSchedule.next_due_mileage <= models.Vehicle.mileage
            ),
            and_(
                models.MaintenanceSchedule.is_engine_hours_based == True,
                models.VehicleMaintenanceSchedule.next_due_engine_hours <= models.Vehicle.engine_hours
            )
        )
    ).join(
        models.Vehicle, 
        models.VehicleMaintenanceSchedule.vehicle_id == models.Vehicle.vehicle_id
    ).join(
        models.MaintenanceSchedule,
        models.VehicleMaintenanceSchedule.schedule_id == models.MaintenanceSchedule.schedule_id
    ).scalar() or 0
    
    return {
        "total_vehicles": total_vehicles,
        "active_vehicles": active_vehicles,
        "out_of_service_vehicles": out_of_service_vehicles,
        "open_work_orders": open_work_orders,
        "critical_work_orders": critical_work_orders,
        "low_inventory_items": low_inventory_items,
        "maintenance_due_count": maintenance_due_count
    }

@router.get("/maintenance-due", response_model=List[schemas.MaintenanceDueItem], summary="Get maintenance due items")
async def get_maintenance_due(
    limit: int = 10,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """
    Get list of vehicles with maintenance due.
    """
    # Query to get maintenance schedules that are due
    maintenance_due = db.query(
        models.VehicleMaintenanceSchedule,
        models.Vehicle,
        models.MaintenanceSchedule
    ).filter(
        or_(
            and_(
                models.VehicleMaintenanceSchedule.next_due_date.isnot(None),
                models.VehicleMaintenanceSchedule.next_due_date <= datetime.utcnow()
            ),
            and_(
                models.MaintenanceSchedule.is_mileage_based == True,
                models.VehicleMaintenanceSchedule.next_due_mileage <= models.Vehicle.mileage
            ),
            and_(
                models.MaintenanceSchedule.is_engine_hours_based == True,
                models.VehicleMaintenanceSchedule.next_due_engine_hours <= models.Vehicle.engine_hours
            )
        )
    ).join(
        models.Vehicle, 
        models.VehicleMaintenanceSchedule.vehicle_id == models.Vehicle.vehicle_id
    ).join(
        models.MaintenanceSchedule,
        models.VehicleMaintenanceSchedule.schedule_id == models.MaintenanceSchedule.schedule_id
    ).limit(limit).all()
    
    result = []
    for schedule, vehicle, maintenance in maintenance_due:
        # Determine how overdue and set priority
        priority = "low"
        
        if maintenance.is_mileage_based and vehicle.mileage and schedule.next_due_mileage:
            miles_overdue = vehicle.mileage - schedule.next_due_mileage
            if miles_overdue > 1000:
                priority = "high"
            elif miles_overdue > 500:
                priority = "medium"
                
        if maintenance.is_time_based and schedule.next_due_date:
            days_overdue = (datetime.utcnow() - schedule.next_due_date).days
            if days_overdue > 30:
                priority = "high"
            elif days_overdue > 14:
                priority = "medium"
        
        # Calculate due values
        due_miles = None
        if maintenance.is_mileage_based and schedule.next_due_mileage:
            if vehicle.mileage > schedule.next_due_mileage:
                due_miles = 0  # Already overdue
            else:
                due_miles = schedule.next_due_mileage - vehicle.mileage
        
        due_engine_hours = None
        if maintenance.is_engine_hours_based and schedule.next_due_engine_hours and vehicle.engine_hours:
            if vehicle.engine_hours > schedule.next_due_engine_hours:
                due_engine_hours = 0  # Already overdue
            else:
                due_engine_hours = float(schedule.next_due_engine_hours - vehicle.engine_hours)
        
        item = {
            "vehicle_id": vehicle.vehicle_id,
            "vehicle_name": f"{vehicle.make} {vehicle.model} ({vehicle.year})",
            "vin": vehicle.vin,
            "service": maintenance.name,
            "due_miles": due_miles,
            "due_date": schedule.next_due_date,
            "due_engine_hours": due_engine_hours,
            "priority": priority
        }
        
        result.append(item)
    
    return result

@router.get("/recent-work-orders", response_model=List[schemas.RecentWorkOrder], summary="Get recent work orders")
async def get_recent_work_orders(
    limit: int = 5,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """
    Get the most recent work orders.
    """
    # Join query to get work orders with vehicle info
    recent_orders = db.query(
        models.WorkOrder,
        models.Vehicle
    ).join(
        models.Vehicle,
        models.WorkOrder.vehicle_id == models.Vehicle.vehicle_id
    ).order_by(
        models.WorkOrder.created_at.desc()
    ).limit(limit).all()
    
    result = []
    for order, vehicle in recent_orders:
        item = {
            "work_order_id": order.work_order_id,
            "vehicle_id": vehicle.vehicle_id,
            "vehicle_name": f"{vehicle.make} {vehicle.model} ({vehicle.year})",
            "description": order.description,
            "status": order.status,
            "date": order.created_at
        }
        result.append(item)
    
    return result

@router.get("/alerts", summary="Get system alerts")
async def get_alerts(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """
    Get system alerts including diagnostic codes, low inventory, and overdue maintenance.
    """
    # Get recent diagnostic codes not linked to a work order
    diagnostic_codes = db.query(
        models.DiagnosticCode,
        models.Vehicle
    ).filter(
        models.DiagnosticCode.work_order_id.is_(None),
        models.DiagnosticCode.resolved_date.is_(None)
    ).join(
        models.Vehicle,
        models.DiagnosticCode.vehicle_id == models.Vehicle.vehicle_id
    ).order_by(
        models.DiagnosticCode.reported_date.desc()
    ).limit(5).all()
    
    diagnostic_alerts = []
    for code, vehicle in diagnostic_codes:
        diagnostic_alerts.append({
            "type": "diagnostic_code",
            "code": code.code,
            "description": code.description,
            "vehicle": f"{vehicle.make} {vehicle.model}",
            "vehicle_id": vehicle.vehicle_id,
            "reported_date": code.reported_date,
            "severity": code.severity or "Medium"
        })
    
    # Get critically low inventory items
    low_inventory = db.query(
        models.PartsInventory
    ).filter(
        models.PartsInventory.quantity_on_hand <= models.PartsInventory.minimum_quantity
    ).order_by(
        (models.PartsInventory.quantity_on_hand / models.PartsInventory.minimum_quantity).asc()
    ).limit(5).all()
    
    inventory_alerts = []
    for part in low_inventory:
        inventory_alerts.append({
            "type": "low_inventory",
            "part_id": part.part_id,
            "part_name": part.name,
            "part_number": part.part_number,
            "quantity": part.quantity_on_hand,
            "minimum": part.minimum_quantity,
            "severity": "Critical" if part.quantity_on_hand == 0 else "High"
        })
    
    # Get severely overdue maintenance
    overdue_maintenance = db.query(
        models.VehicleMaintenanceSchedule,
        models.Vehicle,
        models.MaintenanceSchedule
    ).filter(
        or_(
            and_(
                models.VehicleMaintenanceSchedule.next_due_date.isnot(None),
                models.VehicleMaintenanceSchedule.next_due_date <= datetime.utcnow() - timedelta(days=30)
            ),
            and_(
                models.MaintenanceSchedule.is_mileage_based == True,
                models.VehicleMaintenanceSchedule.next_due_mileage + 1000 <= models.Vehicle.mileage
            )
        )
    ).join(
        models.Vehicle, 
        models.VehicleMaintenanceSchedule.vehicle_id == models.Vehicle.vehicle_id
    ).join(
        models.MaintenanceSchedule,
        models.VehicleMaintenanceSchedule.schedule_id == models.MaintenanceSchedule.schedule_id
    ).limit(5).all()
    
    maintenance_alerts = []
    for schedule, vehicle, maintenance in overdue_maintenance:
        maintenance_alerts.append({
            "type": "overdue_maintenance",
            "vehicle_id": vehicle.vehicle_id,
            "vehicle_name": f"{vehicle.make} {vehicle.model}",
            "service": maintenance.name,
            "due_date": schedule.next_due_date,
            "due_mileage": schedule.next_due_mileage,
            "severity": "High"
        })
    
    # Combine all alerts
    all_alerts = diagnostic_alerts + inventory_alerts + maintenance_alerts
    
    # Sort by severity
    severity_order = {"Critical": 0, "High": 1, "Medium": 2, "Low": 3}
    all_alerts.sort(key=lambda x: severity_order.get(x["severity"], 999))
    
    return {
        "alerts": all_alerts,
        "alert_counts": {
            "total": len(all_alerts),
            "diagnostic": len(diagnostic_alerts),
            "inventory": len(inventory_alerts),
            "maintenance": len(maintenance_alerts)
        }
    }