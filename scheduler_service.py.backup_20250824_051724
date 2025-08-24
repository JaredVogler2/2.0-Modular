"""
Diagnostic script to find why Gantt is showing old data
Run this in your PythonProject2-Aurora2.0-Modular directory
"""
import os
import sys
import json
from datetime import datetime
import requests

def diagnose_gantt_issue():
    """Comprehensive diagnosis of the Gantt issue"""

    print("=" * 80)
    print("GANTT CHART DIAGNOSTIC")
    print("=" * 80)

    # 1. Verify we're in the right directory
    print("\n1. CHECKING PROJECT DIRECTORY...")
    current_dir = os.getcwd()
    if "PythonProject2-Aurora2.0-Modular" in current_dir:
        print(f"   ✅ Correct project: {current_dir}")
    else:
        print(f"   ❌ Wrong project: {current_dir}")
        print("   Please run from PythonProject2-Aurora2.0-Modular!")
        return

    # 2. Check templates/dashboard.html
    print("\n2. CHECKING DASHBOARD.HTML...")
    dashboard_path = os.path.join("templates", "dashboard.html")
    if os.path.exists(dashboard_path):
        with open(dashboard_path, 'r') as f:
            content = f.read()

        # Check for correct script paths
        correct_paths = [
            '/static/js/core/app.js',
            '/static/js/modules/project/project.js'
        ]
        wrong_paths = [
            'updated-dashboard-js.js',
            '/static/js/app.js'  # Old structure
        ]

        for path in correct_paths:
            if path in content:
                print(f"   ✅ Found correct path: {path}")
            else:
                print(f"   ❌ Missing correct path: {path}")

        for path in wrong_paths:
            if path in content:
                print(f"   ❌ PROBLEM: Found OLD path: {path}")
                print("      This is loading the wrong JavaScript!")
    else:
        print(f"   ❌ dashboard.html not found!")

    # 3. Check static/js structure
    print("\n3. CHECKING STATIC/JS STRUCTURE...")
    static_js = os.path.join("static", "js")
    if os.path.exists(static_js):
        contents = os.listdir(static_js)
        print(f"   Contents: {contents}")

        if 'core' in contents and 'modules' in contents:
            print("   ✅ Correct modular structure")

            # Check project.js specifically
            project_js = os.path.join(static_js, "modules", "project", "project.js")
            if os.path.exists(project_js):
                with open(project_js, 'r') as f:
                    project_content = f.read()[:200]
                if 'ProjectModule' in project_content:
                    print("   ✅ project.js has ProjectModule class")
                else:
                    print("   ❌ project.js missing ProjectModule class")
        else:
            print("   ❌ Wrong structure - missing core/modules")
            if any('updated-dashboard' in f for f in contents):
                print("   ❌ PROBLEM: Found old 'updated-dashboard' files!")

    # 4. Test Flask endpoints
    print("\n4. TESTING FLASK ENDPOINTS...")
    try:
        # Test if Flask is running
        response = requests.get("http://localhost:5000/health", timeout=2)
        if response.ok:
            print("   ✅ Flask app is running")

            # Test baseline endpoint
            print("\n   Testing /baseline endpoint...")
            response = requests.get("http://localhost:5000/baseline")
            if response.ok:
                data = response.json()
                tasks = data.get('tasks', data.get('data', []))
                print(f"   ✅ Received {len(tasks)} tasks")

                if tasks and len(tasks) > 0:
                    first_task = tasks[0]
                    print(f"   First task: {first_task.get('taskId', 'unknown')}")
                    print(f"   Start time: {first_task.get('startTime', 'unknown')}")

                    # Check if it's old data
                    if '2025-08' in str(first_task.get('startTime', '')):
                        print("   ⚠️  Tasks have August 2025 dates (hardcoded in scheduler.py)")

                    # Check for generation metadata
                    if '_generated_at' in first_task:
                        print(f"   ✅ Has generation timestamp: {first_task['_generated_at']}")
                    else:
                        print("   ⚠️  No generation timestamp (using old scheduler_service.py?)")
            else:
                print(f"   ❌ /baseline endpoint failed: {response.status_code}")
        else:
            print(f"   ❌ Flask health check failed")
    except requests.exceptions.ConnectionError:
        print("   ❌ Flask app not running! Start it with: python app.py")
    except Exception as e:
        print(f"   ❌ Error testing Flask: {e}")

    # 5. Check for problematic files
    print("\n5. CHECKING FOR PROBLEMATIC FILES...")
    problematic_files = [
        ('static/js/updated-dashboard-js.js', 'Old dashboard JS'),
        ('static/js/app.js', 'Old app.js in wrong location'),
        ('scheduling_results_baseline.csv', 'Old output CSV'),
    ]

    found_problems = False
    for file, description in problematic_files:
        if os.path.exists(file):
            print(f"   ❌ PROBLEM: Found {description}: {file}")
            stat = os.stat(file)
            mod_time = datetime.fromtimestamp(stat.st_mtime)
            print(f"      Modified: {mod_time}")
            found_problems = True

    if not found_problems:
        print("   ✅ No problematic files found")

    # 6. Check scheduler_service.py
    print("\n6. CHECKING SCHEDULER_SERVICE.PY...")
    service_path = os.path.join("backend", "services", "scheduler_service.py")
    if os.path.exists(service_path):
        with open(service_path, 'r') as f:
            service_content = f.read()

        # Check for bad patterns
        if 'read_csv' in service_content and 'scheduling_results' in service_content:
            print("   ❌ PROBLEM: scheduler_service.py reads from CSV files!")
        elif 'scenario_results = {}' in service_content:
            print("   ❌ PROBLEM: scheduler_service.py uses caching!")
        elif 'NO CACHING' in service_content:
            print("   ✅ scheduler_service.py has no caching (good!)")
        else:
            print("   ⚠️  Can't determine if scheduler_service.py is correct")

    # DIAGNOSIS SUMMARY
    print("\n" + "=" * 80)
    print("DIAGNOSIS SUMMARY")
    print("=" * 80)

    print("\nMOST LIKELY ISSUES:")
    print("1. Browser cache - Try Ctrl+Shift+Delete and clear everything")
    print("2. Wrong dashboard.html - Check script src paths")
    print("3. Old JavaScript files in static/js - Remove updated-dashboard-js.js")
    print("4. Flask serving from wrong directory - Check app.py static_folder")

    print("\nRECOMMENDED ACTIONS:")
    print("1. Clear browser cache completely")
    print("2. Delete any files named 'updated-dashboard*' in static/js")
    print("3. Verify dashboard.html uses /static/js/core/ and /static/js/modules/ paths")
    print("4. Restart Flask app")
    print("5. Open browser in Incognito mode to test")

if __name__ == "__main__":
    diagnose_gantt_issue()