import sqlite3
import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Get database URL from environment variable
db_url = os.getenv("DATABASE_URL")
print(f"DATABASE_URL from environment: {db_url}")

if db_url and db_url.startswith("sqlite:///"):
    db_path = db_url.replace("sqlite:///", "")
    print(f"Using SQLite database at {db_path}")
    
    try:
        # Connect to the database
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        # Get table schema
        cursor.execute("PRAGMA table_info(vehicles)")
        columns = cursor.fetchall()
        
        print(f"Found {len(columns)} columns in the vehicles table:")
        for col in columns:
            print(f"- {col[1]} ({col[2]})")
        
        # Check if unit_number column exists
        unit_number_exists = any(col[1] == "unit_number" for col in columns)
        print(f"unit_number column exists: {unit_number_exists}")
        
        # If unit_number column doesn't exist, add it
        if not unit_number_exists:
            print("Adding unit_number column to vehicles table...")
            cursor.execute("ALTER TABLE vehicles ADD COLUMN unit_number VARCHAR(50)")
            conn.commit()
            print("unit_number column added successfully")
        
        conn.close()
    except sqlite3.Error as e:
        print(f"SQLite error: {e}")
else:
    print("DATABASE_URL is not set or is not a SQLite database URL")
