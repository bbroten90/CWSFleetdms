import os

print("Environment variables:")
for key, value in os.environ.items():
    print(f"{key}={value}")
