import os
import sqlite3
from dotenv import load_dotenv
import sys

# Load environment variables from .env file
load_dotenv()

def check_database(db_path, db_name):
    """
    Check if a database exists and print information about it.
    """
    print(f"\n===== Checking {db_name} at {db_path} =====")
    
    # Check if the database file exists
    if not os.path.exists(db_path):
        print(f"Database file {db_path} does not exist")
        return False
    
    print(f"Database file {db_path} exists")
    
    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        # Get list of tables
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
        tables = cursor.fetchall()
        
        print(f"Found {len(tables)} tables in the database:")
        for table in tables:
            table_name = table[0]
            print(f"- {table_name}")
            
            # Get row count
            cursor.execute(f"SELECT COUNT(*) FROM {table_name}")
            row_count = cursor.fetchone()[0]
            print(f"  Row count: {row_count}")
            
            # If this is the vehicles table, show more details
            if table_name == 'vehicles':
                print(f"  Checking vehicles table structure:")
                cursor.execute(f"PRAGMA table_info({table_name})")
                columns = cursor.fetchall()
                for col in columns:
                    print(f"    - {col[1]} ({col[2]})")
                
                print(f"  Sample data (up to 5 rows):")
                cursor.execute(f"SELECT * FROM {table_name} LIMIT 5")
                rows = cursor.fetchall()
                
                if rows:
                    # Get column names
                    column_names = [description[0] for description in cursor.description]
                    print(f"    Columns: {', '.join(column_names)}")
                    
                    # Print rows
                    for row in rows:
                        print(f"    Row: {row}")
                else:
                    print("    No data found")
        
        conn.close()
        return True
        
    except sqlite3.Error as e:
        print(f"SQLite error: {e}")
        return False

# Check both databases
print("Checking both potential database files...")

# Get the current directory
current_dir = os.getcwd()
print(f"Current directory: {current_dir}")

# Check the database specified in .env
db_url = os.getenv("DATABASE_URL")
print(f"DATABASE_URL from environment: {db_url}")

if db_url and db_url.startswith("sqlite:///"):
    db_path = db_url.replace("sqlite:///", "")
    check_database(db_path, "Database from .env")

# Check dispatch.db
check_database("dispatch.db", "dispatch.db")

# Check fleet_dms.db
check_database("fleet_dms.db", "fleet_dms.db")

# Check for any .db files in the current directory
print("\n===== Checking for any .db files in the current directory =====")
for file in os.listdir('.'):
    if file.endswith('.db'):
        print(f"Found .db file: {file}")
        check_database(file, file)

# Check for any .db files in the user's home directory
print("\n===== Checking for any .db files in the user's home directory =====")
home_dir = os.path.expanduser("~")
print(f"Home directory: {home_dir}")
try:
    for file in os.listdir(home_dir):
        if file.endswith('.db'):
            print(f"Found .db file in home directory: {file}")
            check_database(os.path.join(home_dir, file), file)
except Exception as e:
    print(f"Error checking home directory: {e}")

# Check for any .db files in common locations
print("\n===== Checking for any .db files in common locations =====")
common_locations = [
    os.path.join(home_dir, "Documents"),
    os.path.join(home_dir, "Downloads"),
    os.path.join(home_dir, "Desktop"),
    os.path.join(os.getcwd(), ".."),  # Parent directory
]

for location in common_locations:
    print(f"Checking location: {location}")
    try:
        if os.path.exists(location):
            for file in os.listdir(location):
                if file.endswith('.db'):
                    print(f"Found .db file in {location}: {file}")
                    check_database(os.path.join(location, file), file)
        else:
            print(f"Location {location} does not exist")
    except Exception as e:
        print(f"Error checking location {location}: {e}")
