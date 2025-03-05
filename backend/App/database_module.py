# database_module.py
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import QueuePool
import logging
import sys
import os
import sys

# Add parent directory to path so we can import config
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from config import settings

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Database connection URL from settings
DATABASE_URL = settings.DATABASE_URL
logger.info(f"Using database: {DATABASE_URL}")

# Create engine with optimized connection pooling for cloud environments
try:
    engine = create_engine(
        DATABASE_URL,
        poolclass=QueuePool,
        pool_size=5,
        max_overflow=10,
        pool_timeout=30,
        pool_recycle=1800,  # Recycle connections after 30 minutes
        connect_args={"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}
    )
    # Test connection
    with engine.connect() as conn:
        conn.execute("SELECT 1")
    logger.info("Database connection successful")
except Exception as e:
    logger.error(f"Error connecting to database: {str(e)}")
    # In production, you might want to exit if database connection fails
    if "sqlite" not in DATABASE_URL:
        logger.critical("Cannot connect to production database, exiting")
        sys.exit(1)

# Create session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base class for models
Base = declarative_base()

# Dependency to get a database session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
