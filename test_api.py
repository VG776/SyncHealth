#!/usr/bin/env python3
"""
API Testing Script
Tests all endpoints of the Heart Disease Prediction API
"""

import requests
import json
import time

BASE_URL = 'http://localhost:5000/api'

# Test data
SAMPLE_USER = {
    'Age': 45,
    'Sex': 1,
    'ChestPainType': 2,
    'RestingBP': 130,
    'Cholesterol': 250,
    'FastingBS': 0,
    'RestingECG': 1,
    'MaxHR': 150,
    'ExerciseAngina': 0,
    'Oldpeak': 1.0,
    'ST_Slope': 1
}

PARTIAL_USER = {
    'Age': 55,
    'RestingBP': 140,
    'Cholesterol': 280
}

def test_health():
    """Test health check endpoint"""
    print("\n📋 Testing: GET /api/health")
    try:
        response = requests.get(f'{BASE_URL}/health', timeout=5)
        print(f"Status: {response.status_code}")
        print(f"Response: {json.dumps(response.json(), indent=2)}")
        return response.status_code == 200
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

def test_feature_info():
    """Test feature info endpoint"""
    print("\n📋 Testing: GET /api/feature-info")
    try:
        response = requests.get(f'{BASE_URL}/feature-info', timeout=5)
        print(f"Status: {response.status_code}")
        data = response.json()
        print(f"Features: {data.get('feature_names', [])}")
        return response.status_code == 200
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

def test_predict_full():
    """Test prediction with full data"""
    print("\n📋 Testing: POST /api/predict (Full Data)")
    print(f"Payload: {json.dumps(SAMPLE_USER, indent=2)}")
    try:
        response = requests.post(
            f'{BASE_URL}/predict',
            json=SAMPLE_USER,
            timeout=15
        )
        print(f"Status: {response.status_code}")
        result = response.json()
        print(f"Response: {json.dumps(result, indent=2)}")
        
        # Check response structure
        required_fields = ['status', 'prediction', 'probability', 'risk_level', 'recommendation']
        for field in required_fields:
            if field not in result:
                print(f"❌ Missing field: {field}")
                return False
        
        return response.status_code == 200
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

def test_predict_partial():
    """Test prediction with partial data (missing data handling)"""
    print("\n📋 Testing: POST /api/predict (Partial Data - Missing Data Handling)")
    print(f"Payload: {json.dumps(PARTIAL_USER, indent=2)}")
    try:
        response = requests.post(
            f'{BASE_URL}/predict',
            json=PARTIAL_USER,
            timeout=15
        )
        print(f"Status: {response.status_code}")
        result = response.json()
        print(f"Probability: {result['probability']:.2%}")
        print(f"Risk Level: {result['risk_level']}")
        print(f"Auto-Filled Fields: {result.get('imputed_fields', [])}")
        print(f"Recommendation: {result['recommendation'][:100]}...")
        return response.status_code == 200
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

def test_batch_predict():
    """Test batch prediction"""
    print("\n📋 Testing: POST /api/batch-predict")
    batch_data = {
        'patients': [
            {'Age': 45, 'Sex': 1, 'RestingBP': 130, 'Cholesterol': 250},
            {'Age': 60, 'Sex': 0, 'RestingBP': 145, 'Cholesterol': 300},
        ]
    }
    print(f"Payload: {json.dumps(batch_data, indent=2)}")
    try:
        response = requests.post(
            f'{BASE_URL}/batch-predict',
            json=batch_data,
            timeout=15
        )
        print(f"Status: {response.status_code}")
        result = response.json()
        print(f"Results Count: {result['count']}")
        for i, res in enumerate(result['results'], 1):
            print(f"  Patient {i}: {res['probability']:.2%} ({res['risk_level']})")
        return response.status_code == 200
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

def run_all_tests():
    """Run all tests"""
    print("=" * 70)
    print("❤️  HEART DISEASE PREDICTION API - TEST SUITE")
    print("=" * 70)
    
    tests = [
        ('Health Check', test_health),
        ('Feature Info', test_feature_info),
        ('Full Prediction', test_predict_full),
        ('Partial Prediction', test_predict_partial),
        ('Batch Prediction', test_batch_predict),
    ]
    
    results = {}
    start_time = time.time()
    
    for name, test_func in tests:
        try:
            results[name] = test_func()
        except KeyboardInterrupt:
            print("\n⏸️  Test interrupted by user")
            break
        except Exception as e:
            print(f"❌ Unexpected error in {name}: {e}")
            results[name] = False
        time.sleep(0.5)
    
    elapsed = time.time() - start_time
    
    # Summary
    print("\n" + "=" * 70)
    print("TEST SUMMARY")
    print("=" * 70)
    passed = sum(1 for v in results.values() if v)
    total = len(results)
    
    for name, result in results.items():
        status = "✓ PASS" if result else "✗ FAIL"
        print(f"{status}: {name}")
    
    print(f"\nTotal: {passed}/{total} passed in {elapsed:.1f}s")
    
    if passed == total:
        print("\n🎉 All tests passed!")
    else:
        print(f"\n⚠️  {total - passed} test(s) failed")
    
    return passed == total

if __name__ == '__main__':
    print("Make sure backend is running: python app.py")
    print("Waiting 2 seconds before starting tests...")
    time.sleep(2)
    
    success = run_all_tests()
    exit(0 if success else 1)
