import logging
from fastapi import FastAPI
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

# Enable logging
logging.basicConfig(level=logging.DEBUG)

app = FastAPI()

# Database Connection
DATABASE_URL = "postgresql://postgres:yourpassword@localhost/fleet_dms"

try:
    engine = create_engine(DATABASE_URL)
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    Base = declarative_base()
    logging.info("✅ Database connected successfully!")
except Exception as e:
    logging.error(f"❌ Database connection failed: {e}")

@app.get("/")
def read_root():
    return {"message": "Fleet DMS API is connected to PostgreSQL!"}

if __name__ == "__main__":
    import uvicorn
    logging.info("🚀 Starting FastAPI server...")
    uvicorn.run(app, host="127.0.0.1", port=8000, reload=True)
