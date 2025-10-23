#!/usr/bin/env python3
"""
Test Script for Validation Engine
Tests all endpoints and Socket.IO functionality
"""

import requests
import json
import time
from datetime import datetime

# Configuration
BASE_URL = 'http://localhost:5002'
COLORS = {
    'GREEN': '\033[92m',
    'RED': '\033[91m',
    'YELLOW': '\033[93m',
    'BLUE': '\033[94m',
    'END': '\033[0m'
}

def print_header(text):
    print(f"\n{'='*60}")
    print(f"{COLORS['BLUE']}{text}{COLORS['END']}")
    print('='*60)

def print_success(text):
    print(f"{COLORS['GREEN']}✅ {text}{COLORS['END']}")

def print_error(text):
    print(f"{COLORS['RED']}❌ {text}{COLORS['END']}")

def print_info(text):
    print(f"{COLORS['YELLOW']}ℹ️  {text}{COLORS['END']}")

def test_health_check():
    """Test health check endpoint"""
    print_header("Test 1: Health Check")
    
    try:
        response = requests.get(f'{BASE_URL}/api/health')
        if response.status_code == 200:
            data = response.json()
            print_success(f"Health check passed")
            print_info(f"Service: {data.get('service')}")
            print_info(f"Version: {data.get('version')}")
            return True
        else:
            print_error(f"Health check failed: {response.status_code}")
            return False
    except Exception as e:
        print_error(f"Health check failed: {str(e)}")
        print_info("Make sure validation engine is running: python validation_engine.py")
        return False

def test_get_modules():
    """Test get modules endpoint"""
    print_header("Test 2: Get Modules")
    
    try:
        response = requests.get(f'{BASE_URL}/api/modules')
        if response.status_code == 200:
            data = response.json()
            modules = data.get('modules', [])
            print_success(f"Retrieved {len(modules)} modules")
            
            in_progress = [m for m in modules if m['status'] == 'In Progress']
            completed = [m for m in modules if m['status'] == 'Completed']
            
            print_info(f"In Progress: {len(in_progress)}")
            print_info(f"Completed: {len(completed)}")
            
            for module in in_progress:
                print(f"  📋 {module['title']} - Assigned to: {module['assignedTo']}")
            
            return True
        else:
            print_error(f"Failed to get modules: {response.status_code}")
            return False
    except Exception as e:
        print_error(f"Failed to get modules: {str(e)}")
        return False

def test_get_users():
    """Test get users endpoint"""
    print_header("Test 3: Get Users")
    
    try:
        response = requests.get(f'{BASE_URL}/api/users')
        if response.status_code == 200:
            data = response.json()
            users = data.get('users', [])
            print_success(f"Retrieved {len(users)} users")
            
            for user in users:
                print(f"  👤 {user['name']} (@{user['githubUsername']})")
            
            return True
        else:
            print_error(f"Failed to get users: {response.status_code}")
            return False
    except Exception as e:
        print_error(f"Failed to get users: {str(e)}")
        return False

def test_webhook_validation():
    """Test GitHub webhook validation"""
    print_header("Test 4: Webhook Validation (Auto-complete Task)")
    
    # Simulate GitHub webhook payload
    test_payload = {
        'pusher': {
            'name': 'Fresh-MC',
            'email': 'sachin@example.com'
        },
        'repository': {
            'name': 'Tracker',
            'full_name': 'Fresh-MC/Tracker'
        },
        'ref': 'refs/heads/main',
        'commits': [
            {
                'id': 'abc123',
                'message': 'Test commit',
                'timestamp': datetime.utcnow().isoformat()
            }
        ]
    }
    
    try:
        print_info("Simulating GitHub push from Fresh-MC to Tracker repo...")
        
        response = requests.post(
            f'{BASE_URL}/webhook/test',
            json=test_payload,
            headers={'Content-Type': 'application/json'}
        )
        
        if response.status_code == 200:
            data = response.json()
            
            if data.get('status') == 'success' and data.get('module'):
                module = data['module']
                print_success("Task auto-completed!")
                print_info(f"Module: {module['title']}")
                print_info(f"Status: {module['status']}")
                print_info(f"Completed at: {module.get('completedAt', 'N/A')}")
                return True
            elif data.get('status') == 'no_match':
                print_error("No matching module found")
                print_info("This could mean:")
                print_info("  - No module assigned to Fresh-MC")
                print_info("  - No module with status 'In Progress'")
                print_info("  - No module with validation rule for 'Tracker' repo")
                return False
            else:
                print_error(f"Unexpected response: {data}")
                return False
        else:
            print_error(f"Webhook test failed: {response.status_code}")
            print_info(f"Response: {response.text}")
            return False
            
    except Exception as e:
        print_error(f"Webhook test failed: {str(e)}")
        return False

def test_verification():
    """Verify the module was actually updated"""
    print_header("Test 5: Verify Module Update")
    
    try:
        response = requests.get(f'{BASE_URL}/api/modules')
        if response.status_code == 200:
            data = response.json()
            modules = data.get('modules', [])
            
            # Find the module that should have been completed
            target_module = None
            for module in modules:
                if module['assignedTo'] == 'user_001' and module['validationRule'].get('repo') == 'Tracker':
                    target_module = module
                    break
            
            if target_module:
                if target_module['status'] == 'Completed':
                    print_success("Module successfully updated to 'Completed'")
                    print_info(f"Module: {target_module['title']}")
                    print_info(f"Completed at: {target_module.get('completedAt', 'N/A')}")
                    print_info(f"Completed by: {target_module.get('completedBy', 'N/A')}")
                    return True
                else:
                    print_error(f"Module status is '{target_module['status']}', expected 'Completed'")
                    return False
            else:
                print_error("Could not find target module")
                return False
        else:
            print_error(f"Failed to verify: {response.status_code}")
            return False
            
    except Exception as e:
        print_error(f"Verification failed: {str(e)}")
        return False

def run_all_tests():
    """Run all tests"""
    print_header("🧪 Validation Engine Test Suite")
    print(f"Testing validation engine at: {BASE_URL}")
    print(f"Time: {datetime.utcnow().isoformat()}")
    
    results = []
    
    # Test 1: Health Check
    results.append(('Health Check', test_health_check()))
    time.sleep(1)
    
    if not results[0][1]:
        print_error("\n⚠️  Validation engine is not running. Please start it first:")
        print_info("   python validation_engine.py")
        return
    
    # Test 2: Get Modules
    results.append(('Get Modules', test_get_modules()))
    time.sleep(1)
    
    # Test 3: Get Users
    results.append(('Get Users', test_get_users()))
    time.sleep(1)
    
    # Test 4: Webhook Validation
    results.append(('Webhook Validation', test_webhook_validation()))
    time.sleep(1)
    
    # Test 5: Verify Update
    results.append(('Verify Update', test_verification()))
    
    # Summary
    print_header("📊 Test Summary")
    
    passed = sum(1 for _, result in results if result)
    total = len(results)
    
    for test_name, result in results:
        status = f"{COLORS['GREEN']}✅ PASS{COLORS['END']}" if result else f"{COLORS['RED']}❌ FAIL{COLORS['END']}"
        print(f"{test_name:25} {status}")
    
    print(f"\n{COLORS['BLUE']}Results: {passed}/{total} tests passed{COLORS['END']}")
    
    if passed == total:
        print_success("\n🎉 All tests passed! Validation engine is working correctly.")
    else:
        print_error(f"\n⚠️  {total - passed} test(s) failed. Check the output above for details.")

if __name__ == '__main__':
    run_all_tests()
