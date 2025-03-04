import requests
import json
import sys

# Get the token from command line arguments
if len(sys.argv) < 2:
    print("Usage: python test_reset_sync.py <token>")
    sys.exit(1)

token = sys.argv[1]

# Base URL for the API
base_url = "http://localhost:8000"

# Headers for the request
headers = {
    "Authorization": f"Bearer {token}",
    "Content-Type": "application/json"
}

# Test the reset endpoint
def test_reset_sync():
    print("Testing reset sync endpoint...")
    
    try:
        # Call the reset endpoint
        response = requests.post(f"{base_url}/api/samsara/sync/reset", headers=headers)
        
        # Check if the request was successful
        if response.status_code == 200:
            print("Reset sync successful!")
            print(f"Response: {json.dumps(response.json(), indent=2)}")
            return True
        else:
            print(f"Error: {response.status_code}")
            print(f"Response: {response.text}")
            return False
    except Exception as e:
        print(f"Error: {str(e)}")
        return False

# Test the sync status endpoint
def test_sync_status():
    print("\nTesting sync status endpoint...")
    
    try:
        # Call the sync status endpoint
        response = requests.get(f"{base_url}/api/samsara/sync/status", headers=headers)
        
        # Check if the request was successful
        if response.status_code == 200:
            print("Get sync status successful!")
            print(f"Response: {json.dumps(response.json(), indent=2)}")
            return True
        else:
            print(f"Error: {response.status_code}")
            print(f"Response: {response.text}")
            return False
    except Exception as e:
        print(f"Error: {str(e)}")
        return False

# Run the tests
if __name__ == "__main__":
    # First, check the current sync status
    test_sync_status()
    
    # Then, reset the sync status
    test_reset_sync()
    
    # Finally, check the sync status again to verify it was reset
    test_sync_status()
