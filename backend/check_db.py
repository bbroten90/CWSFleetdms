#!/usr/bin/env python3
import os
import sqlite3
from dotenv import load_dotenv
import sys

# Load environment variables from .env file
load_dotenv()

def check_database():
    """
    Check the database structure and print information about tables and data.
    """
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
        
        # Check if the database file exists
        print(f"Checking if database file exists at: {os.path.abspath(db_path)}")
        if not os.path.exists(db_path):
            print(f"Database file {db_path} does not exist")
            
            # List files in the current directory
            print("Files in current directory:")
            for file in os.listdir('.'):
                print(f"  {file}")
            
            return False
        
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
                
                # Get table schema
                cursor.execute(f"PRAGMA table_info({table_name})")
                columns = cursor.fetchall()
                print(f"  Columns:")
                for col in columns:
                    print(f"    - {col[1]} ({col[2]})")
                
                # Get row count
                cursor.execute(f"SELECT COUNT(*) FROM {table_name}")
                row_count = cursor.fetchone()[0]
                print(f"  Row count: {row_count}")
                
                # If this is a Samsara-related table, show some sample data
                if table_name in ['vehicles', 'samsara_vehicles', 'diagnostic_codes']:
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
                
                print()  # Empty line between tables
            
            conn.close()
            return True
            
        except sqlite3.Error as e:
            print(f"SQLite error: {e}")
            return False
    else:
        print(f"Unsupported database URL format: {db_url}")
        return False

if __name__ == "__main__":
    print("Checking database structure...")
    success = check_database()
    
    if success:
        print("Database check completed successfully!")
    else:
        print("Database check failed. Please check the error messages above.")
        sys.exit(1)
