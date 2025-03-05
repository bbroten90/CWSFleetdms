# models.py
from sqlalchemy import Column, Integer, String, Boolean, Float, ForeignKey, DateTime, Date, Text, Numeric
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from datetime import datetime

Base = declarative_base()

# Vehicle model
class Vehicle(Base):
    __tablename__ = "vehicles"
    
    vehicle_id = Column(Integer, primary_key=True, index=True)
    vin = Column(String(17), unique=True, nullable=False)
    samsara_id = Column(String(50), unique=True, index=True)
    unit_number = Column(String(50))  # Added unit_number field
    make = Column(String(50), nullable=False)
    model = Column(String(50), nullable=False)
    year = Column(Integer, nullable=False)
    license_plate = Column(String(20))
    status = Column(String(20), nullable=False)  # Active, Out-of-service, etc.
    mileage = Column(Integer)
    engine_hours = Column(Numeric(10, 2))
    last_service_date = Column(DateTime)
    purchase_date = Column(Date)
    department = Column(String(50))
    assigned_driver_id = Column(Integer)
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())
    
    # Relationships
    work_orders = relationship("WorkOrder", back_populates="vehicle")
    maintenance_schedules = relationship("VehicleMaintenanceSchedule", back_populates="vehicle")
    diagnostic_codes = relationship("DiagnosticCode", back_populates="vehicle")
    documents = relationship("VehicleDocument", back_populates="vehicle")

# Maintenance schedules model
class MaintenanceSchedule(Base):
    __tablename__ = "maintenance_schedules"
    
    schedule_id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    description = Column(Text)
    is_mileage_based = Column(Boolean, default=True)
    is_time_based = Column(Boolean, default=False)
    is_engine_hours_based = Column(Boolean, default=False)
    mileage_interval = Column(Integer)
    time_interval_days = Column(Integer)
    engine_hours_interval = Column(Numeric(10, 2))
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())
    
    # Relationships
    vehicle_schedules = relationship("VehicleMaintenanceSchedule", back_populates="schedule")

# Vehicle maintenance association model
class VehicleMaintenanceSchedule(Base):
    __tablename__ = "vehicle_maintenance_schedules"
    
    id = Column(Integer, primary_key=True, index=True)
    vehicle_id = Column(Integer, ForeignKey("vehicles.vehicle_id"))
    schedule_id = Column(Integer, ForeignKey("maintenance_schedules.schedule_id"))
    last_performed_date = Column(DateTime)
    last_performed_mileage = Column(Integer)
    last_performed_engine_hours = Column(Numeric(10, 2))
    next_due_date = Column(DateTime)
    next_due_mileage = Column(Integer)
    next_due_engine_hours = Column(Numeric(10, 2))
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())
    
    # Relationships
    vehicle = relationship("Vehicle", back_populates="maintenance_schedules")
    schedule = relationship("MaintenanceSchedule", back_populates="vehicle_schedules")

# Work orders model
class WorkOrder(Base):
    __tablename__ = "work_orders"
    
    work_order_id = Column(Integer, primary_key=True, index=True)
    vehicle_id = Column(Integer, ForeignKey("vehicles.vehicle_id"))
    status = Column(String(20), nullable=False)  # Open, In-progress, Completed, Cancelled
    priority = Column(String(10), nullable=False)  # Low, Medium, High, Critical
    description = Column(Text, nullable=False)
    reported_issue = Column(Text)
    diagnosis = Column(Text)
    resolution = Column(Text)
    created_by = Column(Integer, nullable=False)
    assigned_to = Column(Integer, ForeignKey("technicians.technician_id"))
    start_date = Column(DateTime)
    completed_date = Column(DateTime)
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())
    
    # Relationships
    vehicle = relationship("Vehicle", back_populates="work_orders")
    tasks = relationship("WorkOrderTask", back_populates="work_order")
    parts = relationship("WorkOrderPart", back_populates="work_order")
    assigned_technician = relationship("Technician", back_populates="assigned_work_orders")
    diagnostic_codes = relationship("DiagnosticCode", back_populates="work_order")

# Work order tasks model
class WorkOrderTask(Base):
    __tablename__ = "work_order_tasks"
    
    task_id = Column(Integer, primary_key=True, index=True)
    work_order_id = Column(Integer, ForeignKey("work_orders.work_order_id"))
    description = Column(Text, nullable=False)
    status = Column(String(20), nullable=False)  # Pending, In-progress, Completed, Skipped
    estimated_hours = Column(Numeric(5, 2))
    actual_hours = Column(Numeric(5, 2))
    technician_id = Column(Integer, ForeignKey("technicians.technician_id"))
    completed_date = Column(DateTime)
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())
    
    # Relationships
    work_order = relationship("WorkOrder", back_populates="tasks")
    technician = relationship("Technician", back_populates="tasks")

# Parts inventory model
class PartsInventory(Base):
    __tablename__ = "parts_inventory"
    
    part_id = Column(Integer, primary_key=True, index=True)
    part_number = Column(String(50), nullable=False)
    name = Column(String(100), nullable=False)
    description = Column(Text)
    category = Column(String(50))
    manufacturer = Column(String(50))
    location = Column(String(50))
    unit_cost = Column(Numeric(10, 2))
    quantity_on_hand = Column(Integer, nullable=False, default=0)
    minimum_quantity = Column(Integer, nullable=False, default=0)
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())
    
    # Relationships
    work_order_parts = relationship("WorkOrderPart", back_populates="part")
    purchase_order_items = relationship("PurchaseOrderItem", back_populates="part")

# Parts used in work orders model
class WorkOrderPart(Base):
    __tablename__ = "work_order_parts"
    
    id = Column(Integer, primary_key=True, index=True)
    work_order_id = Column(Integer, ForeignKey("work_orders.work_order_id"))
    part_id = Column(Integer, ForeignKey("parts_inventory.part_id"))
    quantity = Column(Integer, nullable=False)
    unit_cost = Column(Numeric(10, 2), nullable=False)
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())
    
    # Relationships
    work_order = relationship("WorkOrder", back_populates="parts")
    part = relationship("PartsInventory", back_populates="work_order_parts")

# Technicians model
class Technician(Base):
    __tablename__ = "technicians"
    
    technician_id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.user_id"), nullable=False)
    first_name = Column(String(50), nullable=False)
    last_name = Column(String(50), nullable=False)
    email = Column(String(100), nullable=False)
    phone = Column(String(20))
    specialties = Column(Text)
    certification = Column(Text)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())
    
    # Relationships
    user = relationship("User", back_populates="technician_profile")
    tasks = relationship("WorkOrderTask", back_populates="technician")
    assigned_work_orders = relationship("WorkOrder", back_populates="assigned_technician")

# Diagnostic codes model
class DiagnosticCode(Base):
    __tablename__ = "diagnostic_codes"
    
    code_id = Column(Integer, primary_key=True, index=True)
    vehicle_id = Column(Integer, ForeignKey("vehicles.vehicle_id"))
    code = Column(String(20), nullable=False)
    description = Column(Text)
    severity = Column(String(20))
    reported_date = Column(DateTime, nullable=False)
    resolved_date = Column(DateTime)
    work_order_id = Column(Integer, ForeignKey("work_orders.work_order_id"))
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())
    
    # Relationships
    vehicle = relationship("Vehicle", back_populates="diagnostic_codes")
    work_order = relationship("WorkOrder", back_populates="diagnostic_codes")

# Vehicle documents model
class VehicleDocument(Base):
    __tablename__ = "vehicle_documents"
    
    document_id = Column(Integer, primary_key=True, index=True)
    vehicle_id = Column(Integer, ForeignKey("vehicles.vehicle_id"))
    title = Column(String(100), nullable=False)
    document_type = Column(String(50), nullable=False)
    file_path = Column(String(255), nullable=False)
    uploaded_by = Column(Integer, ForeignKey("users.user_id"), nullable=False)
    expiration_date = Column(Date)
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())
    
    # Relationships
    vehicle = relationship("Vehicle", back_populates="documents")
    uploader = relationship("User")

# Vendors model
class Vendor(Base):
    __tablename__ = "vendors"
    
    vendor_id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    contact_name = Column(String(100))
    email = Column(String(100))
    phone = Column(String(20))
    address = Column(Text)
    vendor_type = Column(String(50))
    notes = Column(Text)
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())
    
    # Relationships
    purchase_orders = relationship("PurchaseOrder", back_populates="vendor")

# Purchase orders model
class PurchaseOrder(Base):
    __tablename__ = "purchase_orders"
    
    po_id = Column(Integer, primary_key=True, index=True)
    vendor_id = Column(Integer, ForeignKey("vendors.vendor_id"))
    status = Column(String(20), nullable=False)
    order_date = Column(DateTime, nullable=False)
    expected_delivery_date = Column(DateTime)
    actual_delivery_date = Column(DateTime)
    total_amount = Column(Numeric(10, 2))
    created_by = Column(Integer, ForeignKey("users.user_id"), nullable=False)
    notes = Column(Text)
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())
    
    # Relationships
    vendor = relationship("Vendor", back_populates="purchase_orders")
    items = relationship("PurchaseOrderItem", back_populates="purchase_order")
    creator = relationship("User")

# Purchase order items model
class PurchaseOrderItem(Base):
    __tablename__ = "purchase_order_items"
    
    item_id = Column(Integer, primary_key=True, index=True)
    po_id = Column(Integer, ForeignKey("purchase_orders.po_id"))
    part_id = Column(Integer, ForeignKey("parts_inventory.part_id"))
    quantity = Column(Integer, nullable=False)
    unit_price = Column(Numeric(10, 2), nullable=False)
    received_quantity = Column(Integer, default=0)
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())
    
    # Relationships
    purchase_order = relationship("PurchaseOrder", back_populates="items")
    part = relationship("PartsInventory", back_populates="purchase_order_items")

# Users model
class User(Base):
    __tablename__ = "users"
    
    user_id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    first_name = Column(String(50), nullable=False)
    last_name = Column(String(50), nullable=False)
    email = Column(String(100), unique=True, nullable=False)
    role = Column(String(20), nullable=False)
    is_active = Column(Boolean, default=True)
    last_login = Column(DateTime)
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())
    preferences = relationship("UserPreferences", back_populates="user", uselist=False)
    
    # Relationships
    activity_logs = relationship("ActivityLog", back_populates="user")
    technician_profile = relationship("Technician", back_populates="user", uselist=False)

# Activity logs model
class ActivityLog(Base):
    __tablename__ = "activity_logs"
    
    log_id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.user_id"))
    action = Column(String(50), nullable=False)
    entity_type = Column(String(50), nullable=False)
    entity_id = Column(Integer, nullable=False)
    details = Column(Text)
    ip_address = Column(String(45))
    created_at = Column(DateTime, default=func.now())
    
    # Relationships
    user = relationship("User", back_populates="activity_logs")
    user = relationship("User", back_populates="preferences")

# System configuration model
class SystemConfig(Base):
    __tablename__ = "system_config"
    
    config_id = Column(Integer, primary_key=True, index=True)
    config_key = Column(String(50), unique=True, nullable=False)
    config_value = Column(String(255), nullable=False)
    description = Column(Text)
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())

# Add the UserPreferences model to models.py
class UserPreferences(Base):
    __tablename__ = "user_preferences"
    
    preference_id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.user_id"), unique=True)
    theme = Column(String(20), default="light")
    dashboard_layout = Column(String(20), default="default")
    notifications_enabled = Column(Boolean, default=True)
    email_notifications_enabled = Column(Boolean, default=True)
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())
    
   

