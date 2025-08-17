#!/usr/bin/env python3
"""
Simple test script to verify backend endpoints
"""

import requests
import json

BASE_URL = "http://localhost:5000/api"

def test_health():
    """Test health check endpoint"""
    try:
        response = requests.get(f"{BASE_URL}/health")
        print(f"Health check: {response.status_code}")
        if response.status_code == 200:
            print("✓ Backend is running")
        else:
            print("✗ Backend health check failed")
    except Exception as e:
        print(f"✗ Cannot connect to backend: {e}")

def test_login():
    """Test login endpoint"""
    try:
        data = {
            "email": "test@example.com",
            "password": "password123"
        }
        response = requests.post(f"{BASE_URL}/login", json=data)
        print(f"Login test: {response.status_code}")
        if response.status_code == 200:
            print("✓ Login successful")
            return response.cookies
        else:
            print(f"✗ Login failed: {response.text}")
            return None
    except Exception as e:
        print(f"✗ Login test error: {e}")
        return None

def test_history(cookies):
    """Test history endpoint"""
    if not cookies:
        print("✗ No cookies for history test")
        return
    
    try:
        response = requests.get(f"{BASE_URL}/history", cookies=cookies)
        print(f"History test: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"✓ History loaded: {len(data.get('uploads', []))} uploads")
        else:
            print(f"✗ History failed: {response.text}")
    except Exception as e:
        print(f"✗ History test error: {e}")

def test_settings(cookies):
    """Test settings endpoint"""
    if not cookies:
        print("✗ No cookies for settings test")
        return
    
    try:
        response = requests.get(f"{BASE_URL}/settings", cookies=cookies)
        print(f"Settings test: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"✓ Settings loaded for user: {data.get('user', {}).get('name', 'Unknown')}")
        else:
            print(f"✗ Settings failed: {response.text}")
    except Exception as e:
        print(f"✗ Settings test error: {e}")

if __name__ == "__main__":
    print("Testing backend endpoints...")
    print("=" * 50)
    
    test_health()
    print()
    
    cookies = test_login()
    print()
    
    if cookies:
        test_history(cookies)
        print()
        test_settings(cookies)
    
    print("=" * 50)
    print("Testing completed!")
