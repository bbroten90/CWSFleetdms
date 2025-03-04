import os
from dotenv import load_dotenv

# Load current environment variables
load_dotenv()

# Get current DATABASE_URL
current_db_url = os.getenv("DATABASE_URL")
print(f"Current DATABASE_URL: {current_db_url}")

# Update .env file to point to dispatch.db
with open(".env", "r") as f:
    lines = f.readlines()

with open(".env", "w") as f:
    for line in lines:
        if line.startswith("DATABASE_URL="):
            f.write("DATABASE_URL=sqlite:///./dispatch.db\n")
        else:
            f.write(line)

print("Updated .env file to point to dispatch.db")

# Load updated environment variables
load_dotenv()

# Get updated DATABASE_URL
updated_db_url = os.getenv("DATABASE_URL")
print(f"Updated DATABASE_URL: {updated_db_url}")
