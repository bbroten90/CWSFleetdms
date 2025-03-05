#!/usr/bin/env python
"""
Test database connection script for Fleet DMS.
"""
import os
import sys
from dotenv import load_dotenv
from sqlalchemy import create_engine, text
import logging

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

def test_database_connection():
    """Test connection to the database specified in the .env file."""
    try:
        # Load environment variables
        logger.info("Loading environment variables from .env")
        load_dotenv()
        
        # Get database URL
        database_url = os.getenv("DATABASE_URL")
        if not database_url:
            logger.error("DATABASE_URL not found in environment variables")
            return False
        
        # Mask password for logging
        masked_url = database_url.replace("://", "://***:***@", 1).split("@")[0] + "@" + database_url.split("@")[1]
        logger.info(f"Attempting to connect to database: {masked_url}")
        
        # Create engine and test connection
        engine = create_engine(database_url)
        
        with engine.connect() as connection:
            logger.info("Connection established, executing test query")
            result = connection.execute(text("SELECT 1"))
            logger.info(f"Query result: {result.fetchone()}")
            
        logger.info("Database connection test successful!")
        return True
    
    except Exception as e:
        logger.error(f"Error connecting to database: {str(e)}")
        return False

if __name__ == "__main__":
    success = test_database_connection()
    sys.exit(0 if success else 1)
