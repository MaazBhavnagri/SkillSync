import requests
import json
import os
from datetime import datetime

BASE_URL = 'http://localhost:5000/api'

def test_health():
    """Test health endpoint"""
    try:
        response = requests.get(f'{BASE_URL}/health')
        print(f"Health check: {response.status_code}")
        print(f"Response: {response.json()}")
        return response.status_code == 200
    except Exception as e:
        print(f"Health check failed: {e}")
        return False

def test_signup():
    """Test user signup"""
    try:
        data = {
            'name': 'Test User API',
            'email': f'testapi_{datetime.now().strftime("%Y%m%d_%H%M%S")}@example.com',
            'password': 'testpass123'
        }
        
        response = requests.post(f'{BASE_URL}/auth/signup', json=data)
        print(f"Signup: {response.status_code}")
        
        if response.status_code == 201:
            result = response.json()
            print(f"Access token: {result.get('access_token')[:20]}...")
            return result.get('access_token')
        else:
            print(f"Signup failed: {response.json()}")
            return None
    except Exception as e:
        print(f"Signup failed: {e}")
        return None

def test_login():
    """Test user login"""
    try:
        data = {
            'email': 'test@example.com',
            'password': 'test123'
        }
        
        response = requests.post(f'{BASE_URL}/auth/login', json=data)
        print(f"Login: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            print(f"Access token: {result.get('access_token')[:20]}...")
            return result.get('access_token')
        else:
            print(f"Login failed: {response.json()}")
            return None
    except Exception as e:
        print(f"Login failed: {e}")
        return None

def test_protected_endpoints(token):
    """Test protected endpoints"""
    headers = {'Authorization': f'Bearer {token}'}
    
    # Test settings
    try:
        response = requests.get(f'{BASE_URL}/settings', headers=headers)
        print(f"Get settings: {response.status_code}")
        
        if response.status_code == 200:
            print("Settings retrieved successfully")
        
        # Test history
        response = requests.get(f'{BASE_URL}/history', headers=headers)
        print(f"Get history: {response.status_code}")
        
        if response.status_code == 200:
            print("History retrieved successfully")
        
        # Test latest results
        response = requests.get(f'{BASE_URL}/results/latest', headers=headers)
        print(f"Get latest result: {response.status_code}")
        
        if response.status_code == 404:
            print("No uploads found (expected)")
        elif response.status_code == 200:
            print("Latest result retrieved successfully")
        
    except Exception as e:
        print(f"Protected endpoint test failed: {e}")

def run_tests():
    """Run all API tests"""
    print("=== API Testing Started ===")
    
    # Test health
    if not test_health():
        print("Health check failed, stopping tests")
        return
    
    # Test signup
    token = test_signup()
    if not token:
        print("Trying login instead...")
        token = test_login()
    
    if token:
        print("Authentication successful")
        test_protected_endpoints(token)
    else:
        print("Authentication failed")
    
    print("=== API Testing Complete ===")

if __name__ == '__main__':
    run_tests()