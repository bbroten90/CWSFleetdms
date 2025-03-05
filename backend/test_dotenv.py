from dotenv import load_dotenv
import os

print("Before loading .env file:")
print(f"SAMSARA_API_KEY={os.getenv('SAMSARA_API_KEY')}")

print("\nLoading .env file...")
load_dotenv(override=True)

print("\nAfter loading .env file:")
print(f"SAMSARA_API_KEY={os.getenv('SAMSARA_API_KEY')}")
