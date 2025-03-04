#!/usr/bin/env python3
import os
import sqlite3
import psycopg2
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

def run_migration():
    """
    Run the migration to add unit_number to vehicles table.
    This script supports both SQLite and PostgreSQL databases.
    """
    print("Starting migration...")
    
    # Get database URL from environment variable
    db_url = os.getenv("DATABASE_URL")
    print(f"DATABASE_URL from environment: {db_url}")
    
    if not db_url:
        print("Error: DATABASE_URL environment variable not set")
        return False
    
    # Determine database type
    if db_url.startswith("sqlite:///"):
        # SQLite database
        db_path = db_url.replace("sqlite:///", "")
        print(f"Using SQLite database at {db_path}")
        
        try:
            conn = sqlite3.connect(db_path)
            cursor = conn.cursor()
            
            # Add unit_number column
            cursor.execute("ALTER TABLE vehicles ADD COLUMN unit_number VARCHAR(50)")
            
            # Note: SQLite doesn't support subqueries in UPDATE statements the same way
            # So we'll do a simpler update if there's a samsara_vehicles table
            try:
                cursor.execute("SELECT name, samsara_id FROM samsara_vehicles")
                samsara_vehicles = cursor.fetchall()
                
                for name, samsara_id in samsara_vehicles:
                    if name and samsara_id:
                        cursor.execute(
                            "UPDATE vehicles SET unit_number = ? WHERE samsara_id = ?",
                            (name, samsara_id)
                        )
            except sqlite3.OperationalError:
                print("Note: samsara_vehicles table not found, skipping data migration")
            
            # Create index
            cursor.execute("CREATE INDEX idx_vehicles_unit_number ON vehicles(unit_number)")
            
            conn.commit()
            conn.close()
            print("Migration completed successfully for SQLite database")
            return True
            
        except sqlite3.Error as e:
            print(f"SQLite error: {e}")
            return False
            
    elif db_url.startswith("postgresql://"):
        # PostgreSQL database
        print("Using PostgreSQL database")
        
        try:
            conn = psycopg2.connect(db_url)
            cursor = conn.cursor()
            
            # Add unit_number column
            cursor.execute("ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS unit_number VARCHAR(50)")
            
            # Update from samsara_vehicles if the table exists
            try:
                cursor.execute("""
                    UPDATE vehicles 
                    SET unit_number = sv.name
                    FROM samsara_vehicles sv
                    WHERE vehicles.samsara_id = sv.samsara_id
                    AND vehicles.samsara_id IS NOT NULL
                """)
            except psycopg2.errors.UndefinedTable:
                print("Note: samsara_vehicles table not found, skipping data migration")
            
            # Create index
            cursor.execute("""
                CREATE INDEX IF NOT EXISTS idx_vehicles_unit_number 
                ON vehicles(unit_number)
            """)
            
            conn.commit()
            cursor.close()
            conn.close()
            print("Migration completed successfully for PostgreSQL database")
            return True
            
        except psycopg2.Error as e:
            print(f"PostgreSQL error: {e}")
            return False
    else:
        print(f"Unsupported database URL format: {db_url}")
        return False

if __name__ == "__main__":
    print("Running migration to add unit_number to vehicles table...")
    success = run_migration()
    
    if success:
        print("Migration completed successfully!")
    else:
        print("Migration failed. Please check the error messages above.")
