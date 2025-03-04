# create_test_data.py
import os
import sys
from datetime import datetime, timedelta
import random
from sqlalchemy.orm import Session

# Import required libraries
import logging
from sqlalchemy import text

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)
logger.info("Starting test data script...")

# Import models and database
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from App.database_module import get_db, SessionLocal, engine
from App import models
from App.models import Base
from auth import get_password_hash

# Check if database exists and has the right structure
try:
    # Check if we can connect to the database
    session = SessionLocal()
    session.execute(text("SELECT 1"))
    logger.info("Successfully connected to database")
    session.close()
except Exception as e:
    logger.error(f"Error connecting to database: {str(e)}")
    # Continue anyway as the tables will be created below

# Create database tables
models.Base.metadata.create_all(bind=engine)

# Sample data
truck_models = [
    {"make": "Freightliner", "model": "Cascadia", "years": [2018, 2019, 2020, 2021, 2022]},
    {"make": "Kenworth", "model": "T680", "years": [2019, 2020, 2021, 2022]},
    {"make": "Peterbilt", "model": "579", "years": [2018, 2019, 2020, 2021]},
    {"make": "Volvo", "model": "VNL", "years": [2019, 2020, 2021, 2022]},
    {"make": "Mack", "model": "Anthem", "years": [2020, 2021, 2022]}
]

statuses = ["Active", "Out-of-service", "In-repair", "Scheduled"]
departments = ["Operations", "Distribution", "Long-haul", "Local"]

maintenance_types = [
    {"name": "Oil Change", "description": "Regular oil and filter change", 
     "is_mileage_based": True, "mileage_interval": 15000},
    {"name": "Transmission Service", "description": "Transmission fluid change", 
     "is_mileage_based": True, "mileage_interval": 50000},
    {"name": "Brake Inspection", "description": "Brake pad and rotor inspection", 
     "is_mileage_based": True, "mileage_interval": 25000},
    {"name": "Annual DOT Inspection", "description": "Required DOT safety inspection", 
     "is_time_based": True, "time_interval_days": 365},
    {"name": "Coolant Flush", "description": "Engine coolant replacement", 
     "is_mileage_based": True, "mileage_interval": 60000},
    {"name": "Air Filter Replacement", "description": "Engine air filter change", 
     "is_mileage_based": True, "mileage_interval": 30000},
    {"name": "Tire Rotation", "description": "Rotate tires for even wear", 
     "is_mileage_based": True, "mileage_interval": 20000}
]

parts = [
    {"part_number": "OIL-5W40-1", "name": "Engine Oil 5W-40", "category": "Fluids", 
     "quantity_on_hand": 45, "minimum_quantity": 10, "unit_cost": 17.99},
    {"part_number": "FIL-OIL-F150", "name": "Oil Filter", "category": "Filters", 
     "quantity_on_hand": 30, "minimum_quantity": 15, "unit_cost": 8.99},
    {"part_number": "FIL-AIR-A100", "name": "Air Filter", "category": "Filters", 
     "quantity_on_hand": 12, "minimum_quantity": 8, "unit_cost": 24.99},
    {"part_number": "BRK-PAD-F250", "name": "Brake Pads - Front", "category": "Brakes", 
     "quantity_on_hand": 8, "minimum_quantity": 4, "unit_cost": 89.99},
    {"part_number": "BRK-PAD-R250", "name": "Brake Pads - Rear", "category": "Brakes", 
     "quantity_on_hand": 6, "minimum_quantity": 4, "unit_cost": 79.99},
    {"part_number": "BRK-RTR-F350", "name": "Brake Rotor - Front", "category": "Brakes", 
     "quantity_on_hand": 4, "minimum_quantity": 2, "unit_cost": 149.99},
    {"part_number": "TRN-FLU-1GAL", "name": "Transmission Fluid", "category": "Fluids", 
     "quantity_on_hand": 18, "minimum_quantity": 6, "unit_cost": 21.99},
    {"part_number": "CLT-FLU-1GAL", "name": "Engine Coolant", "category": "Fluids", 
     "quantity_on_hand": 9, "minimum_quantity": 5, "unit_cost": 18.99},
    {"part_number": "TIR-11R22.5", "name": "Drive Tire 11R22.5", "category": "Tires", 
     "quantity_on_hand": 3, "minimum_quantity": 6, "unit_cost": 299.99},
    {"part_number": "TIR-295/75R22.5", "name": "Steer Tire 295/75R22.5", "category": "Tires", 
     "quantity_on_hand": 2, "minimum_quantity": 4, "unit_cost": 349.99}
]

work_order_descriptions = [
    "Regular PM service",
    "Check engine light diagnosis",
    "Brake pad replacement",
    "Transmission fluid leak repair",
    "DOT inspection preparation",
    "A/C system repair",
    "Coolant leak diagnosis",
    "Tire replacement",
    "Electrical system diagnosis",
    "Suspension repair"
]

work_order_statuses = ["Open", "In-progress", "Completed", "Cancelled"]
work_order_priorities = ["Low", "Medium", "High", "Critical"]

# Function to create test data
def create_test_data():
    db = SessionLocal()
    try:
        # Only create data if the database is empty
        user_exists = None
        try:
            user_exists = db.query(models.User).first()
        except Exception as e:
            logger.error(f"Error querying users: {str(e)}")
        
        if user_exists is not None:
            logger.info("Database already contains data. Skipping test data creation.")
            return
        
        logger.info("Creating test data...")
        
        # Create users
        admin_user = models.User(
            username="admin",
            password_hash=get_password_hash("admin123"),
            first_name="Admin",
            last_name="User",
            email="admin@fleetdms.com",
            role="admin",
            is_active=True
        )
        db.add(admin_user)
        
        manager_user = models.User(
            username="manager",
            password_hash=get_password_hash("manager123"),
            first_name="Fleet",
            last_name="Manager",
            email="manager@fleetdms.com",
            role="manager",
            is_active=True
        )
        db.add(manager_user)
        
        tech_user = models.User(
            username="tech",
            password_hash=get_password_hash("tech123"),
            first_name="Tech",
            last_name="User",
            email="tech@fleetdms.com",
            role="technician",
            is_active=True
        )
        db.add(tech_user)
        
        db.commit()
        
        # Create technician profile
        technician = models.Technician(
            user_id=tech_user.user_id,
            first_name=tech_user.first_name,
            last_name=tech_user.last_name,
            email=tech_user.email,
            phone="555-123-4567",
            specialties="Engine, Brakes, Electrical",
            certification="ASE Master Technician",
            is_active=True
        )
        db.add(technician)
        db.commit()
        
        # Create vehicles
        vehicles = []
        for i in range(1, 21):  # Create 20 vehicles
            truck = random.choice(truck_models)
            make = truck["make"]
            model = truck["model"]
            year = random.choice(truck["years"])
            
            vehicle = models.Vehicle(
                vin=f"1HTMM{random.randint(100000, 999999)}{i}".ljust(17, "0"),
                samsara_id=f"SAM{i:04d}" if i % 3 != 0 else None,  # Some without Samsara
                make=make,
                model=model,
                year=year,
                license_plate=f"TRK-{i:04d}",
                status=random.choice(statuses),
                mileage=random.randint(10000, 150000),
                engine_hours=random.randint(1000, 10000),
                last_service_date=datetime.now() - timedelta(days=random.randint(1, 90)),
                purchase_date=datetime(year, random.randint(1, 12), random.randint(1, 28)).date(),
                department=random.choice(departments),
                assigned_driver_id=None
            )
            db.add(vehicle)
            vehicles.append(vehicle)
        
        db.commit()
        
        # Create maintenance schedules
        schedules = []
        for maintenance in maintenance_types:
            schedule = models.MaintenanceSchedule(
                name=maintenance["name"],
                description=maintenance["description"],
                is_mileage_based=maintenance.get("is_mileage_based", False),
                is_time_based=maintenance.get("is_time_based", False),
                is_engine_hours_based=maintenance.get("is_engine_hours_based", False),
                mileage_interval=maintenance.get("mileage_interval"),
                time_interval_days=maintenance.get("time_interval_days"),
                engine_hours_interval=maintenance.get("engine_hours_interval")
            )
            db.add(schedule)
            schedules.append(schedule)
        
        db.commit()
        
        # Assign maintenance schedules to vehicles
        for vehicle in vehicles:
            # Assign 3-4 random maintenance schedules to each vehicle
            for schedule in random.sample(schedules, random.randint(3, 4)):
                last_performed_date = datetime.now() - timedelta(days=random.randint(10, 200))
                last_performed_mileage = max(0, vehicle.mileage - random.randint(1000, 20000))
                
                # Calculate next due based on intervals
                next_due_date = None
                if schedule.is_time_based and schedule.time_interval_days:
                    next_due_date = last_performed_date + timedelta(days=schedule.time_interval_days)
                
                next_due_mileage = None
                if schedule.is_mileage_based and schedule.mileage_interval:
                    next_due_mileage = last_performed_mileage + schedule.mileage_interval
                
                next_due_engine_hours = None
                if schedule.is_engine_hours_based and schedule.engine_hours_interval:
                    next_due_engine_hours = vehicle.engine_hours + schedule.engine_hours_interval
                
                vehicle_schedule = models.VehicleMaintenanceSchedule(
                    vehicle_id=vehicle.vehicle_id,
                    schedule_id=schedule.schedule_id,
                    last_performed_date=last_performed_date,
                    last_performed_mileage=last_performed_mileage,
                    last_performed_engine_hours=vehicle.engine_hours - random.randint(100, 1000),
                    next_due_date=next_due_date,
                    next_due_mileage=next_due_mileage,
                    next_due_engine_hours=next_due_engine_hours
                )
                db.add(vehicle_schedule)
        
        db.commit()
        
        # Create parts inventory
        inventory_items = []
        for part_data in parts:
            part = models.PartsInventory(
                part_number=part_data["part_number"],
                name=part_data["name"],
                description=part_data.get("description"),
                category=part_data.get("category"),
                manufacturer=part_data.get("manufacturer"),
                location=f"Shelf {random.choice(['A', 'B', 'C', 'D'])}-{random.randint(1,5)}",
                unit_cost=part_data.get("unit_cost"),
                quantity_on_hand=part_data.get("quantity_on_hand", 0),
                minimum_quantity=part_data.get("minimum_quantity", 0)
            )
            db.add(part)
            inventory_items.append(part)
        
        db.commit()
        
        # Create work orders
        for i in range(1, 31):  # Create 30 work orders
            vehicle = random.choice(vehicles)
            status = random.choice(work_order_statuses)
            created_date = datetime.now() - timedelta(days=random.randint(1, 60))
            
            # Set dates based on status
            start_date = None
            completed_date = None
            
            if status in ["In-progress", "Completed"]:
                start_date = created_date + timedelta(days=random.randint(0, 3))
            
            if status == "Completed":
                completed_date = start_date + timedelta(days=random.randint(1, 5))
            
            work_order = models.WorkOrder(
                vehicle_id=vehicle.vehicle_id,
                status=status,
                priority=random.choice(work_order_priorities),
                description=random.choice(work_order_descriptions),
                reported_issue=f"Driver reported {random.choice(['noise', 'vibration', 'leak', 'warning light', 'performance issue'])}",
                diagnosis=None if status == "Open" else "Technician diagnosed issue with " + random.choice(["brakes", "engine", "transmission", "electrical system", "cooling system"]),
                resolution=None if status != "Completed" else "Repaired and tested. All systems functioning normally.",
                created_by=random.choice([admin_user.user_id, manager_user.user_id]),
                assigned_to=None if status == "Open" else technician.technician_id,
                start_date=start_date,
                completed_date=completed_date,
                created_at=created_date
            )
            db.add(work_order)
            
            # Commit to get the work_order_id
            db.commit()
            
            # Add work order tasks
            for j in range(1, random.randint(2, 5)):
                task_status = "Pending"
                if work_order.status == "In-progress":
                    task_status = random.choice(["Pending", "In-progress", "Completed"])
                elif work_order.status == "Completed":
                    task_status = "Completed"
                
                task = models.WorkOrderTask(
                    work_order_id=work_order.work_order_id,
                    description=f"Task {j}: {random.choice(['Inspect', 'Replace', 'Test', 'Clean', 'Adjust'])} {random.choice(['brakes', 'filters', 'fluids', 'belts', 'electrical'])}",
                    status=task_status,
                    estimated_hours=random.uniform(0.5, 4.0),
                    actual_hours=random.uniform(0.5, 5.0) if task_status == "Completed" else None,
                    technician_id=technician.technician_id if task_status != "Pending" else None,
                    completed_date=work_order.completed_date if task_status == "Completed" else None
                )
                db.add(task)
            
            # Add parts to work orders
            if status in ["In-progress", "Completed"]:
                for _ in range(random.randint(1, 3)):
                    part = random.choice(inventory_items)
                    quantity = random.randint(1, 4)
                    
                    work_order_part = models.WorkOrderPart(
                        work_order_id=work_order.work_order_id,
                        part_id=part.part_id,
                        quantity=quantity,
                        unit_cost=part.unit_cost
                    )
                    db.add(work_order_part)
            
            db.commit()
        
        # Create some diagnostic codes
        for vehicle in random.sample(vehicles, 5):  # Add codes to 5 random vehicles
            code = models.DiagnosticCode(
                vehicle_id=vehicle.vehicle_id,
                code=f"P{random.randint(0, 9)}{random.randint(100, 999)}",
                description=random.choice([
                    "Engine Control Module Fault",
                    "Oxygen Sensor Circuit Malfunction",
                    "Exhaust Gas Recirculation Flow Insufficient",
                    "Fuel Rail Pressure Too Low",
                    "Intake Air Temperature Sensor Circuit"
                ]),
                severity=random.choice(["Low", "Medium", "High"]),
                reported_date=datetime.now() - timedelta(days=random.randint(1, 30))
            )
            db.add(code)
        
        db.commit()
        
        print("Test data created successfully!")
    
    except Exception as e:
        db.rollback()
        print(f"Error creating test data: {str(e)}")
    finally:
        db.close()

if __name__ == "__main__":
    create_test_data()
