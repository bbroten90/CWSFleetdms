ut in thimport os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

print("Current working directory:", os.getcwd())
print("Files in current directory:")
for file in os.listdir('.'):
    print(f"  {file}")

# Get database URL from environment variable
db_url = os.getenv("DATABASE_URL")
print(f"DATABASE_URL from environment: {db_url}")

if db_url and db_url.startswith("sqlite:///"):
    db_path = db_url.replace("sqlite:///", "")
    print(f"Database path: {db_path}")
    print(f"Absolute database path: {os.path.abspath(db_path)}")
    print(f"Database file exists: {os.path.exists(db_path)}")
else:
    print("Not using SQLite or DATABASE_URL not set")
