"""
Test file for Money Health Score Feature 01
Tests the /api/money-health endpoint with sample quiz data
"""
import requests
import json
import sys
import io

# Fix Windows console encoding for emojis
if sys.platform == 'win32':
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

# Base URL
BASE_URL = "http://localhost:8000"

# Sample quiz input - Mix of answers to get moderate score
sample_quiz_data = {
    "answers": [
        {"question_id": 1, "selected_option": "C"},   # Emergency Fund - Average
        {"question_id": 2, "selected_option": "D"},   # Emergency Fund - Needs attention
        {"question_id": 3, "selected_option": "B"},   # Debt Management - Good
        {"question_id": 4, "selected_option": "A"},   # Debt Management - Excellent
        {"question_id": 5, "selected_option": "D"},   # Insurance - Needs attention
        {"question_id": 6, "selected_option": "C"},   # Insurance - Average
        {"question_id": 7, "selected_option": "B"},   # Savings - Good
        {"question_id": 8, "selected_option": "B"},   # Savings - Good
        {"question_id": 9, "selected_option": "C"},   # Investments - Average
        {"question_id": 10, "selected_option": "D"},  # Investments - Needs attention
        {"question_id": 11, "selected_option": "A"},  # Expenses - Excellent
        {"question_id": 12, "selected_option": "B"},  # Expenses - Good
    ],
    "user_name": "Rahul Kumar"
}

def test_money_health_score():
    """Test the Money Health Score endpoint"""
    print("=" * 70)
    print("TESTING MONEY HEALTH SCORE FEATURE")
    print("=" * 70)

    try:
        # Make POST request
        print("\n📤 Sending request to /api/money-health...")
        print(f"Request body: {json.dumps(sample_quiz_data, indent=2)}")

        response = requests.post(
            f"{BASE_URL}/api/money-health",
            json=sample_quiz_data,
            timeout=30
        )

        # Check status code
        print(f"\n✓ Status Code: {response.status_code}")

        if response.status_code == 200:
            result = response.json()

            print("\n" + "=" * 70)
            print("RESPONSE RECEIVED")
            print("=" * 70)

            # Overall Score
            print(f"\n🎯 OVERALL SCORE: {result['overall_score']}/100 (Grade: {result['overall_grade']})")
            print(f"   Personalized for: {result.get('personalized_for', 'Anonymous')}")

            # Dimension Scores
            print("\n📊 DIMENSION SCORES:")
            for dim in result['dimension_scores']:
                print(f"   • {dim['dimension_name']:20s}: {dim['score']:3d}/100  ({dim['status']})")

            # Top 3 Areas to Fix
            print("\n⚠️  TOP 3 AREAS TO FIX:")
            for i, area in enumerate(result['top_3_areas_to_fix'], 1):
                print(f"   {i}. {area}")

            # AI Assessment
            print("\n💡 AI ASSESSMENT:")
            print(f"   {result['ai_assessment']}")

            # Action Plan
            print("\n📋 ACTION PLAN:")
            for item in result['action_plan']:
                priority_label = {1: "HIGH", 2: "MEDIUM", 3: "LOW"}[item['priority']]
                print(f"   [{priority_label:6s}] {item['area']:20s}: {item['action']}")

            # Metadata
            print(f"\n📝 Total Questions: {result['total_questions']}")

            print("\n" + "=" * 70)
            print("✅ TEST PASSED - Feature working correctly!")
            print("=" * 70)

            return True

        else:
            print(f"\n❌ ERROR: Received status code {response.status_code}")
            print(f"Response: {response.text}")
            return False

    except requests.exceptions.ConnectionError:
        print("\n❌ ERROR: Could not connect to server")
        print("   Make sure the server is running:")
        print("   → uvicorn main:app --reload")
        return False

    except Exception as e:
        print(f"\n❌ ERROR: {str(e)}")
        import traceback
        traceback.print_exc()
        return False


if __name__ == "__main__":
    success = test_money_health_score()
    exit(0 if success else 1)
