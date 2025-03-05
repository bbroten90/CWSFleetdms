from dotenv import load_dotenv
import os

print("Before loading .env file:")
print(f"SAMSARA_API_KEY={os.getenv('SAMSARA_API_KEY')}")

print("\nLoading .env file with override=True...")
load_dotenv(override=True)

print("\nAfter loading .env file:")
print(f"SAMSARA_API_KEY={os.getenv('SAMSARA_API_KEY')}")

print("\nImporting settings from config...")
try:
    from config import settings
    print(f"SAMSARA_API_KEY from settings: {settings.SAMSARA_API_KEY}")
    print(f"DATABASE_URL from settings: {settings.DATABASE_URL}")
    print(f"SECRET_KEY from settings: {settings.SECRET_KEY}")
except Exception as e:
    print(f"Error importing settings: {str(e)}")
