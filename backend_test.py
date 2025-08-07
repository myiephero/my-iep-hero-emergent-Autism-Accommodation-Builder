#!/usr/bin/env python3
"""
Backend API Testing for Autism Accommodation Builder
Tests OpenAI GPT-4o integration, MongoDB storage, and API validation
"""

import requests
import json
import time
import os
from datetime import datetime

# Get base URL from environment - using localhost for testing due to ingress routing issues
BASE_URL = "http://localhost:3000"
API_BASE = f"{BASE_URL}/api"

def test_api_health():
    """Test basic API connectivity"""
    print("🔍 Testing API Health...")
    try:
        response = requests.get(f"{API_BASE}/root", timeout=10)
        if response.status_code == 200:
            data = response.json()
            if data.get("message") == "Hello World":
                print("✅ API Health Check: PASSED")
                return True
            else:
                print(f"❌ API Health Check: Unexpected response - {data}")
                return False
        else:
            print(f"❌ API Health Check: Status {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ API Health Check: Connection failed - {e}")
        return False

def test_openai_integration_free_plan():
    """Test OpenAI GPT-4o integration with free plan (8 accommodations)"""
    print("\n🤖 Testing OpenAI Integration - Free Plan...")
    
    test_data = {
        "childName": "Alex",
        "gradeLevel": "3rd", 
        "diagnosisAreas": ["Autism Spectrum Disorder (ASD)", "Sensory Processing Disorder"],
        "sensoryPreferences": ["Sound sensitivity (auditory)", "Need for movement breaks"],
        "behavioralChallenges": ["Difficulty with transitions", "Need for routine/predictability"],
        "communicationMethod": "verbal",
        "additionalInfo": "Alex does well with visual supports and needs advance notice of changes",
        "planType": "free"
    }
    
    try:
        print("📤 Sending accommodation generation request...")
        response = requests.post(
            f"{API_BASE}/accommodations/generate",
            json=test_data,
            headers={"Content-Type": "application/json"},
            timeout=60  # OpenAI can take time
        )
        
        print(f"📥 Response Status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            
            # Validate response structure
            if "accommodations" not in data:
                print("❌ OpenAI Integration: Missing 'accommodations' field in response")
                return False
            
            accommodations = data["accommodations"]
            
            # Check accommodation count for free plan
            if len(accommodations) < 5 or len(accommodations) > 10:
                print(f"⚠️  OpenAI Integration: Expected ~8 accommodations for free plan, got {len(accommodations)}")
            else:
                print(f"✅ OpenAI Integration: Generated {len(accommodations)} accommodations (appropriate for free plan)")
            
            # Validate accommodation structure
            valid_categories = ["Academic", "Behavioral", "Sensory", "Communication", "Environmental"]
            categories_found = set()
            
            for i, acc in enumerate(accommodations):
                required_fields = ["title", "description", "category", "implementation"]
                missing_fields = [field for field in required_fields if field not in acc or not acc[field]]
                
                if missing_fields:
                    print(f"❌ Accommodation {i+1}: Missing fields - {missing_fields}")
                    return False
                
                if acc["category"] not in valid_categories:
                    print(f"⚠️  Accommodation {i+1}: Invalid category '{acc['category']}'")
                else:
                    categories_found.add(acc["category"])
                
                # Check if accommodation is relevant to autism/sensory needs
                content = f"{acc['title']} {acc['description']} {acc['implementation']}".lower()
                autism_keywords = ["sensory", "transition", "visual", "routine", "break", "support", "autism", "movement"]
                if not any(keyword in content for keyword in autism_keywords):
                    print(f"⚠️  Accommodation {i+1}: May not be autism-specific")
            
            print(f"✅ OpenAI Integration: Generated accommodations across {len(categories_found)} categories: {', '.join(categories_found)}")
            print("✅ OpenAI Integration - Free Plan: PASSED")
            return True
            
        elif response.status_code == 500:
            print("❌ OpenAI Integration: Server error - likely OpenAI API issue")
            try:
                error_data = response.json()
                print(f"   Error details: {error_data}")
            except:
                print(f"   Raw response: {response.text}")
            return False
        else:
            print(f"❌ OpenAI Integration: Unexpected status {response.status_code}")
            print(f"   Response: {response.text}")
            return False
            
    except requests.exceptions.Timeout:
        print("❌ OpenAI Integration: Request timeout (>60s) - OpenAI API may be slow")
        return False
    except Exception as e:
        print(f"❌ OpenAI Integration: Request failed - {e}")
        return False

def test_openai_integration_hero_plan():
    """Test OpenAI GPT-4o integration with hero plan (15 accommodations)"""
    print("\n🦸 Testing OpenAI Integration - Hero Plan...")
    
    test_data = {
        "childName": "Emma",
        "gradeLevel": "5th", 
        "diagnosisAreas": ["Autism Spectrum Disorder (ASD)", "ADHD"],
        "sensoryPreferences": ["Visual processing strengths", "Need for quiet environment"],
        "behavioralChallenges": ["Executive functioning challenges", "Social interaction difficulties"],
        "communicationMethod": "verbal with AAC support",
        "additionalInfo": "Emma excels in structured environments and benefits from clear expectations",
        "planType": "hero"
    }
    
    try:
        print("📤 Sending hero plan accommodation request...")
        response = requests.post(
            f"{API_BASE}/accommodations/generate",
            json=test_data,
            headers={"Content-Type": "application/json"},
            timeout=60
        )
        
        print(f"📥 Response Status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            accommodations = data["accommodations"]
            
            # Check accommodation count for hero plan
            if len(accommodations) < 12 or len(accommodations) > 18:
                print(f"⚠️  Hero Plan: Expected ~15 accommodations, got {len(accommodations)}")
            else:
                print(f"✅ Hero Plan: Generated {len(accommodations)} accommodations (appropriate for hero plan)")
            
            print("✅ OpenAI Integration - Hero Plan: PASSED")
            return True
        else:
            print(f"❌ Hero Plan: Status {response.status_code}")
            return False
            
    except Exception as e:
        print(f"❌ Hero Plan: Request failed - {e}")
        return False

def test_mongodb_storage():
    """Test MongoDB storage by checking accommodation history"""
    print("\n🗄️  Testing MongoDB Storage...")
    
    try:
        # First generate an accommodation to ensure we have data
        test_data = {
            "childName": "TestChild_" + str(int(time.time())),
            "gradeLevel": "2nd",
            "diagnosisAreas": ["Autism Spectrum Disorder (ASD)"],
            "sensoryPreferences": ["Visual supports"],
            "behavioralChallenges": ["Routine needs"],
            "communicationMethod": "verbal",
            "additionalInfo": "Test accommodation for storage verification",
            "planType": "free"
        }
        
        print("📤 Creating test accommodation record...")
        create_response = requests.post(
            f"{API_BASE}/accommodations/generate",
            json=test_data,
            headers={"Content-Type": "application/json"},
            timeout=60
        )
        
        if create_response.status_code != 200:
            print(f"❌ MongoDB Storage: Failed to create test record - {create_response.status_code}")
            return False
        
        # Wait a moment for database write
        time.sleep(2)
        
        # Now check if we can retrieve accommodation history
        print("📥 Retrieving accommodation history...")
        history_response = requests.get(f"{API_BASE}/accommodations", timeout=10)
        
        if history_response.status_code == 200:
            history_data = history_response.json()
            
            if not isinstance(history_data, list):
                print("❌ MongoDB Storage: History response is not a list")
                return False
            
            # Look for our test record
            test_record_found = False
            for record in history_data:
                if record.get("childName") == test_data["childName"]:
                    test_record_found = True
                    
                    # Validate record structure
                    required_fields = ["id", "childName", "gradeLevel", "diagnosisAreas", 
                                     "planType", "accommodations", "timestamp"]
                    missing_fields = [field for field in required_fields if field not in record]
                    
                    if missing_fields:
                        print(f"❌ MongoDB Storage: Missing fields in record - {missing_fields}")
                        return False
                    
                    # Validate UUID format
                    if not record["id"] or len(record["id"]) != 36:
                        print(f"❌ MongoDB Storage: Invalid UUID format - {record['id']}")
                        return False
                    
                    # Validate timestamp
                    try:
                        datetime.fromisoformat(record["timestamp"].replace('Z', '+00:00'))
                    except:
                        print(f"❌ MongoDB Storage: Invalid timestamp format - {record['timestamp']}")
                        return False
                    
                    print(f"✅ MongoDB Storage: Test record found with ID {record['id']}")
                    break
            
            if not test_record_found:
                print("❌ MongoDB Storage: Test record not found in history")
                return False
            
            print(f"✅ MongoDB Storage: Retrieved {len(history_data)} total records")
            print("✅ MongoDB Storage: PASSED")
            return True
        else:
            print(f"❌ MongoDB Storage: Failed to retrieve history - {history_response.status_code}")
            return False
            
    except Exception as e:
        print(f"❌ MongoDB Storage: Test failed - {e}")
        return False

def test_api_validation():
    """Test API validation for required fields"""
    print("\n🔍 Testing API Validation...")
    
    # Test missing required fields
    invalid_requests = [
        ({}, "empty request"),
        ({"childName": "Test"}, "missing gradeLevel"),
        ({"childName": "Test", "gradeLevel": "1st"}, "missing diagnosisAreas"),
        ({"childName": "Test", "gradeLevel": "1st", "diagnosisAreas": []}, "empty diagnosisAreas"),
        ({"childName": "Test", "gradeLevel": "1st", "diagnosisAreas": ["ASD"]}, "missing communicationMethod")
    ]
    
    validation_passed = True
    
    for invalid_data, description in invalid_requests:
        try:
            response = requests.post(
                f"{API_BASE}/accommodations/generate",
                json=invalid_data,
                headers={"Content-Type": "application/json"},
                timeout=10
            )
            
            if response.status_code == 400:
                error_data = response.json()
                if "error" in error_data and "required" in error_data["error"].lower():
                    print(f"✅ Validation: Correctly rejected {description}")
                else:
                    print(f"⚠️  Validation: Rejected {description} but with unexpected error message")
            else:
                print(f"❌ Validation: Should have rejected {description} but got status {response.status_code}")
                validation_passed = False
                
        except Exception as e:
            print(f"❌ Validation: Error testing {description} - {e}")
            validation_passed = False
    
    if validation_passed:
        print("✅ API Validation: PASSED")
    else:
        print("❌ API Validation: FAILED")
    
    return validation_passed

def test_accommodation_history_api():
    """Test the accommodation history API endpoint"""
    print("\n📚 Testing Accommodation History API...")
    
    try:
        response = requests.get(f"{API_BASE}/accommodations", timeout=10)
        
        if response.status_code == 200:
            data = response.json()
            
            if not isinstance(data, list):
                print("❌ History API: Response is not a list")
                return False
            
            print(f"✅ History API: Retrieved {len(data)} accommodation records")
            
            # If we have records, validate structure
            if len(data) > 0:
                sample_record = data[0]
                expected_fields = ["id", "childName", "accommodations", "timestamp"]
                missing_fields = [field for field in expected_fields if field not in sample_record]
                
                if missing_fields:
                    print(f"⚠️  History API: Sample record missing fields - {missing_fields}")
                else:
                    print("✅ History API: Record structure is valid")
            
            print("✅ Accommodation History API: PASSED")
            return True
        else:
            print(f"❌ History API: Status {response.status_code}")
            return False
            
    except Exception as e:
        print(f"❌ History API: Request failed - {e}")
        return False

def run_all_tests():
    """Run all backend tests"""
    print("🚀 Starting Backend API Tests for Autism Accommodation Builder")
    print("=" * 70)
    
    test_results = {}
    
    # Test 1: API Health
    test_results["api_health"] = test_api_health()
    
    # Test 2: OpenAI Integration - Free Plan (CRITICAL)
    test_results["openai_free"] = test_openai_integration_free_plan()
    
    # Test 3: OpenAI Integration - Hero Plan (CRITICAL)
    test_results["openai_hero"] = test_openai_integration_hero_plan()
    
    # Test 4: MongoDB Storage
    test_results["mongodb_storage"] = test_mongodb_storage()
    
    # Test 5: API Validation
    test_results["api_validation"] = test_api_validation()
    
    # Test 6: Accommodation History API
    test_results["history_api"] = test_accommodation_history_api()
    
    # Summary
    print("\n" + "=" * 70)
    print("📊 TEST SUMMARY")
    print("=" * 70)
    
    passed_tests = sum(1 for result in test_results.values() if result)
    total_tests = len(test_results)
    
    for test_name, result in test_results.items():
        status = "✅ PASSED" if result else "❌ FAILED"
        print(f"{test_name.replace('_', ' ').title()}: {status}")
    
    print(f"\nOverall: {passed_tests}/{total_tests} tests passed")
    
    if passed_tests == total_tests:
        print("🎉 All backend tests PASSED!")
        return True
    else:
        print("⚠️  Some backend tests FAILED - see details above")
        return False

if __name__ == "__main__":
    success = run_all_tests()
    exit(0 if success else 1)