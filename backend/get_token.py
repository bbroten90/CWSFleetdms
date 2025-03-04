import requests
import json
import sys

# Get the username and password from command line arguments
if len(sys.argv) < 3:
    print("Usage: python get_token.py <username> <password>")
    sys.exit(1)

username = sys.argv[1]
password = sys.argv[2]

# Base URL for the API
base_url = "http://localhost:8000"

# Login to get a token
def get_token():
    print(f"Logging in as {username}...")
    
    try:
        # Create form data for login
        data = {
            "username": username,
            "password": password
        }
        
        # Call the login endpoint
        response = requests.post(
            f"{base_url}/token",
            data=data,
            headers={"Content-Type": "application/x-www-form-urlencoded"}
        )
        
        # Check if the request was successful
        if response.status_code == 200:
            token_data = response.json()
            print("Login successful!")
            print(f"Access token: {token_data['access_token']}")
            return token_data['access_token']
        else:
            print(f"Error: {response.status_code}")
            print(f"Response: {response.text}")
            return None
    except Exception as e:
        print(f"Error: {str(e)}")
        return None

# Run the script
if __name__ == "__main__":
    token = get_token()
    if token:
        print("\nTo test the reset endpoint, run:")
        print(f"python test_reset_sync.py {token}")
