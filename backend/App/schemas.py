# schemas.py
from pydantic import BaseModel, Field, validator
from typing import Optional, List, Union
from datetime import datetime, date

# Base schemas with shared attributes
class VehicleBase(BaseModel):
    vin: str
    samsara_id: Optional[str] = None
    unit_number: Optional[str] = None  # Added unit_number field
    make: str
    model: str
    year: int
    license_plate: Optional[str] = None
    status: str
    mileage: Optional[int] = None
    engine_hours: Optional[float] = None
    purchase_date: Optional[date] = None
    department: Optional[str] = None
    assigned_driver_id: Optional[int] = None

class VehicleCreate(VehicleBase):
    pass

class VehicleUpdate(BaseModel):
    vin: Optional[str] = None
    samsara_id: Optional[str] = None
    unit_number: Optional[str] = None  # Added unit_number field
    make: Optional[str] = None
    model: Optional[str] = None
    year: Optional[int] = None
    license_plate: Optional[str] = None
    status: Optional[str] = None
    mileage: Optional[int] = None
    engine_hours: Optional[float] = None
    last_service_date: Optional[datetime] = None
    purchase_date: Optional[date] = None
    department: Optional[str] = None
    assigned_driver_id: Optional[int] = None

class Vehicle(VehicleBase):
    vehicle_id: int
    last_service_date: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        orm_mode = True
        from_attributes = True

# Simple vehicle schema for inclusion in maintenance responses
class SimpleVehicle(BaseModel):
    vehicle_id: int
    make: str
    model: str
    year: int
    vin: str
    unit_number: Optional[str] = None  # Added unit_number field
    license_plate: Optional[str] = None
    mileage: Optional[int] = None
    engine_hours: Optional[float] = None
    status: str

    class Config:
        orm_mode = True
        from_attributes = True

# User schemas
class UserBase(BaseModel):
    username: str
    first_name: str
    last_name: str
    email: str
    role: str
    is_active: bool = True

class UserCreate(UserBase):
    password: str

class UserUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    email: Optional[str] = None
    role: Optional[str] = None
    is_active: Optional[bool] = None
    password: Optional[str] = None

class User(UserBase):
    user_id: int
    last_login: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        orm_mode = True
        from_attributes = True

# Technician basic schema
class TechnicianBase(BaseModel):
    user_id: int
    first_name: str
    last_name: str
    email: str
    phone: Optional[str] = None
    specialties: Optional[str] = None
    certification: Optional[str] = None
    is_active: bool = True

class TechnicianCreate(TechnicianBase):
    pass

class TechnicianUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    specialties: Optional[str] = None
    certification: Optional[str] = None
    is_active: Optional[bool] = None

class Technician(TechnicianBase):
    technician_id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        orm_mode = True
        from_attributes = True

# Work Order schemas
class WorkOrderBase(BaseModel):
    vehicle_id: int
    status: str = Field(..., description="Open, In-progress, Completed, Cancelled")
    priority: str = Field(..., description="Low, Medium, High, Critical")
    description: str
    reported_issue: Optional[str] = None
    diagnosis: Optional[str] = None
    resolution: Optional[str] = None
    assigned_to: Optional[int] = None

class WorkOrderCreate(WorkOrderBase):
    pass

class WorkOrderUpdate(BaseModel):
    status: Optional[str] = None
    priority: Optional[str] = None
    description: Optional[str] = None
    reported_issue: Optional[str] = None
    diagnosis: Optional[str] = None
    resolution: Optional[str] = None
    assigned_to: Optional[int] = None
    start_date: Optional[datetime] = None
    completed_date: Optional[datetime] = None

class WorkOrder(WorkOrderBase):
    work_order_id: int
    created_by: int
    start_date: Optional[datetime] = None
    completed_date: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        orm_mode = True
        from_attributes = True

# Work Order Task schemas
class WorkOrderTaskBase(BaseModel):
    description: str
    status: str = Field(..., description="Pending, In-progress, Completed, Skipped")
    estimated_hours: Optional[float] = None
    technician_id: Optional[int] = None

class WorkOrderTaskCreate(WorkOrderTaskBase):
    pass

class WorkOrderTaskUpdate(BaseModel):
    description: Optional[str] = None
    status: Optional[str] = None
    estimated_hours: Optional[float] = None
    actual_hours: Optional[float] = None
    technician_id: Optional[int] = None
    completed_date: Optional[datetime] = None

class WorkOrderTask(WorkOrderTaskBase):
    task_id: int
    work_order_id: int
    actual_hours: Optional[float] = None
    completed_date: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        orm_mode = True
        from_attributes = True

# Parts inventory schemas
class PartsInventoryBase(BaseModel):
    part_number: str
    name: str
    description: Optional[str] = None
    category: Optional[str] = None
    manufacturer: Optional[str] = None
    location: Optional[str] = None
    unit_cost: Optional[float] = None
    quantity_on_hand: int = 0
    minimum_quantity: int = 0

class PartsInventoryCreate(PartsInventoryBase):
    pass

class PartsInventoryUpdate(BaseModel):
    part_number: Optional[str] = None
    name: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    manufacturer: Optional[str] = None
    location: Optional[str] = None
    unit_cost: Optional[float] = None
    quantity_on_hand: Optional[int] = None
    minimum_quantity: Optional[int] = None

class PartsInventory(PartsInventoryBase):
    part_id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        orm_mode = True
        from_attributes = True

# Simple part details for inclusion in work order parts response
class PartDetails(BaseModel):
    part_id: int
    part_number: str
    name: str
    category: Optional[str] = None
    location: Optional[str] = None
    quantity_on_hand: int

    class Config:
        orm_mode = True
        from_attributes = True

# Work Order Part schemas
class WorkOrderPartBase(BaseModel):
    part_id: int
    quantity: int
    unit_cost: Optional[float] = None

class WorkOrderPartCreate(WorkOrderPartBase):
    pass

class WorkOrderPartUpdate(BaseModel):
    quantity: Optional[int] = None
    unit_cost: Optional[float] = None

class WorkOrderPart(WorkOrderPartBase):
    id: int
    work_order_id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        orm_mode = True
        from_attributes = True

# Work order part with related part details
class WorkOrderPartWithDetails(WorkOrderPart):
    part: PartDetails

    class Config:
        orm_mode = True
        from_attributes = True

# Work Order with related vehicle info
class WorkOrderWithVehicle(WorkOrder):
    vehicle: Vehicle

    class Config:
        orm_mode = True
        from_attributes = True

# Work order with related details
class WorkOrderWithDetails(WorkOrder):
    tasks: List[WorkOrderTask] = []
    parts: List[WorkOrderPartWithDetails] = []
    vehicle: Optional[Vehicle] = None
    assigned_technician: Optional[Technician] = None

    class Config:
        orm_mode = True
        from_attributes = True

# Maintenance Schedule schemas
class MaintenanceScheduleBase(BaseModel):
    name: str
    description: Optional[str] = None
    is_mileage_based: bool = True
    is_time_based: bool = False
    is_engine_hours_based: bool = False
    mileage_interval: Optional[int] = None
    time_interval_days: Optional[int] = None
    engine_hours_interval: Optional[float] = None

class MaintenanceScheduleCreate(MaintenanceScheduleBase):
    pass

class MaintenanceScheduleUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    is_mileage_based: Optional[bool] = None
    is_time_based: Optional[bool] = None
    is_engine_hours_based: Optional[bool] = None
    mileage_interval: Optional[int] = None
    time_interval_days: Optional[int] = None
    engine_hours_interval: Optional[float] = None

class MaintenanceSchedule(MaintenanceScheduleBase):
    schedule_id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        orm_mode = True
        from_attributes = True

# Vehicle Maintenance Schedule assignment schemas
class VehicleMaintenanceScheduleBase(BaseModel):
    vehicle_id: int
    schedule_id: int
    last_performed_date: Optional[datetime] = None
    last_performed_mileage: Optional[int] = None
    last_performed_engine_hours: Optional[float] = None

class VehicleMaintenanceScheduleCreate(VehicleMaintenanceScheduleBase):
    pass

class VehicleMaintenanceScheduleUpdate(BaseModel):
    last_performed_date: Optional[datetime] = None
    last_performed_mileage: Optional[int] = None
    last_performed_engine_hours: Optional[float] = None
    next_due_date: Optional[datetime] = None
    next_due_mileage: Optional[int] = None
    next_due_engine_hours: Optional[float] = None

class VehicleMaintenanceSchedule(VehicleMaintenanceScheduleBase):
    id: int
    next_due_date: Optional[datetime] = None
    next_due_mileage: Optional[int] = None
    next_due_engine_hours: Optional[float] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        orm_mode = True
        from_attributes = True

# Vehicle maintenance schedule with vehicle and schedule details
class VehicleMaintenanceScheduleWithDetails(VehicleMaintenanceSchedule):
    vehicle: SimpleVehicle
    schedule: MaintenanceSchedule
    is_overdue: bool = False
    is_due_soon: bool = False

    class Config:
        orm_mode = True
        from_attributes = True

# Token schemas for authentication
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None
    user_id: Optional[int] = None
    role: Optional[str] = None

# Samsara integration schemas
class SamsaraVehicleSync(BaseModel):
    samsara_id: str
    mileage: float
    engine_hours: Optional[float] = None

# Dashboard summary schemas
class DashboardSummary(BaseModel):
    total_vehicles: int
    active_vehicles: int
    out_of_service_vehicles: int
    open_work_orders: int
    critical_work_orders: int
    low_inventory_items: int
    maintenance_due_count: int

class MaintenanceDueItem(BaseModel):
    vehicle_id: int
    vehicle_name: str
    vin: str
    service: str
    due_miles: Optional[int] = None
    due_date: Optional[datetime] = None
    due_engine_hours: Optional[float] = None
    priority: str

class RecentWorkOrder(BaseModel):
    work_order_id: int
    vehicle_id: int
    vehicle_name: str
    description: str
    status: str
    date: datetime

class DashboardData(BaseModel):
    summary: DashboardSummary
    maintenance_due: List[MaintenanceDueItem]
    recent_work_orders: List[RecentWorkOrder]

# Inventory Adjustment schema
class InventoryAdjustment(BaseModel):
    quantity: int
    adjustment_type: str = Field(..., description="set, add, or subtract")
    reason: Optional[str] = None
    unit_cost: Optional[float] = None

    @validator('adjustment_type')
    def validate_adjustment_type(cls, v):
        valid_types = ["set", "add", "subtract"]
        if v not in valid_types:
            raise ValueError(f"adjustment_type must be one of: {', '.join(valid_types)}")
        return v
    
    @validator('quantity')
    def validate_quantity(cls, v):
        if v < 0:
            raise ValueError("quantity must be a positive integer")
        return v

# Maintenance completion schema
class MaintenanceCompletion(BaseModel):
    assignment_id: int
    completion_date: Optional[datetime] = None
    current_mileage: Optional[int] = None
    current_engine_hours: Optional[float] = None
    technician_id: Optional[int] = None
    hours_spent: Optional[float] = None
    notes: Optional[str] = None

# Work order from diagnostic schema
class WorkOrderFromDiagnostic(BaseModel):
    description: Optional[str] = None
    priority: Optional[str] = None
    assigned_to: Optional[int] = None
    create_initial_task: bool = True
