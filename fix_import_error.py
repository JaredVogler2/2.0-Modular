"""
Fix character encoding issues in scheduler_service.py
Run this in PythonProject2-Aurora2.0-Modular directory
"""
import os
import shutil
from datetime import datetime

def fix_encoding():
    """Fix encoding issues in scheduler_service.py"""

    print("=" * 80)
    print("FIXING ENCODING ISSUE IN scheduler_service.py")
    print("=" * 80)

    service_path = os.path.join("backend", "services", "scheduler_service.py")

    # Step 1: Backup the file
    backup_path = f"{service_path}.backup_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
    if os.path.exists(service_path):
        shutil.copy2(service_path, backup_path)
        print(f"✅ Backed up to: {backup_path}")

    # Step 2: Try to read with different encodings
    content = None
    encodings_to_try = ['utf-8', 'utf-8-sig', 'latin-1', 'cp1252', 'iso-8859-1']

    for encoding in encodings_to_try:
        try:
            print(f"\nTrying to read with {encoding} encoding...")
            with open(service_path, 'r', encoding=encoding) as f:
                content = f.read()
            print(f"✅ Successfully read with {encoding}")
            break
        except Exception as e:
            print(f"❌ Failed with {encoding}: {e}")

    if content is None:
        print("\n❌ Could not read file with any encoding!")
        print("Creating a fresh scheduler_service.py instead...")
        create_fresh_scheduler_service()
        return

    # Step 3: Clean up any problematic characters
    print("\nCleaning content...")

    # Replace smart quotes and other problematic characters
    replacements = {
        '"': '"',  # Left smart quote
        '"': '"',  # Right smart quote
        ''': "'",  # Left smart single quote
        ''': "'",  # Right smart single quote
        '–': '-',  # En dash
        '—': '-',  # Em dash
        '…': '...',  # Ellipsis
        '\u009d': '',  # Remove the specific problematic character
        '\x9d': '',  # Remove in hex form
    }

    for old, new in replacements.items():
        if old in content:
            content = content.replace(old, new)
            print(f"  Replaced '{old}' with '{new}'")

    # Step 4: Save with UTF-8 encoding
    print("\nSaving with UTF-8 encoding...")
    with open(service_path, 'w', encoding='utf-8') as f:
        f.write(content)

    print("✅ File saved with UTF-8 encoding")

    # Step 5: Verify it works
    print("\nVerifying fix...")
    try:
        with open(service_path, 'r', encoding='utf-8') as f:
            test_read = f.read()
        print("✅ File can now be read properly!")

        # Check if SchedulerService class exists
        if "class SchedulerService" in test_read:
            print("✅ SchedulerService class found in file")
        else:
            print("⚠️  SchedulerService class not found - may need to recreate file")

    except Exception as e:
        print(f"❌ Still has issues: {e}")

def create_fresh_scheduler_service():
    """Create a completely fresh scheduler_service.py"""

    print("\n" + "=" * 80)
    print("CREATING FRESH scheduler_service.py")
    print("=" * 80)

    fresh_content = '''"""
Scheduler Service - Interface to the scheduling engine
"""
import logging
from typing import Dict, List
import threading
from pathlib import Path
import sys

# Add parent directory to path
sys.path.append(str(Path(__file__).parent.parent.parent))
from scheduler import ProductionScheduler

logger = logging.getLogger(__name__)

class SchedulerService:
    """Singleton service for managing scheduler instances"""

    _instance = None
    _lock = threading.Lock()

    def __init__(self):
        self.scheduler = None
        self.initialized = False

    @classmethod
    def get_instance(cls):
        """Get singleton instance"""
        if cls._instance is None:
            with cls._lock:
                if cls._instance is None:
                    cls._instance = cls()
        return cls._instance

    @classmethod
    def initialize(cls):
        """Initialize the scheduler service"""
        instance = cls.get_instance()
        if not instance.initialized:
            logger.info("Initializing scheduler service...")
            instance.scheduler = ProductionScheduler('scheduling_data.csv', debug=True)
            instance.scheduler.load_data_from_csv()
            instance.initialized = True
            logger.info("Scheduler service initialized")

    def get_scenario_data(self, scenario_id: str) -> List:
        """Get data for a specific scenario"""
        print(f"[DEBUG] Generating fresh {scenario_id}")
        
        # Create fresh scheduler
        self.scheduler = ProductionScheduler('scheduling_data.csv', debug=True)
        self.scheduler.load_data_from_csv()
        
        if scenario_id == 'baseline':
            self.scheduler.schedule_tasks(silent_mode=True)
            
            result = []
            for task_id, schedule_info in self.scheduler.task_schedule.items():
                task_data = {}
                if task_id in self.scheduler.tasks:
                    task_data = self.scheduler.tasks[task_id].copy()
                
                # Build dependencies
                dynamic_constraints = self.scheduler.build_dynamic_dependencies()
                task_predecessors = []
                task_successors = []
                
                for constraint in dynamic_constraints:
                    if constraint['Second'] == task_id:
                        task_predecessors.append({
                            'taskId': constraint['First'],
                            'task': constraint['First'],
                            'relationship': constraint.get('Relationship', 'Finish <= Start'),
                            'type': 'Baseline'
                        })
                    if constraint['First'] == task_id:
                        task_successors.append({
                            'taskId': constraint['Second'],
                            'task': constraint['Second'],
                            'relationship': constraint.get('Relationship', 'Finish <= Start'),
                            'type': 'Baseline'
                        })
                
                task_data.update({
                    'taskId': task_id,
                    'startTime': schedule_info['start_time'].isoformat(),
                    'endTime': schedule_info['end_time'].isoformat(),
                    'team': schedule_info['team'],
                    'shift': schedule_info['shift'],
                    'product_line': schedule_info.get('product_line', ''),
                    'duration': schedule_info.get('duration', 0),
                    'mechanics_required': schedule_info.get('mechanics_required', 0),
                    'is_quality': schedule_info.get('is_quality', False),
                    'task_type': schedule_info.get('task_type', ''),
                    'dependencies': task_predecessors,
                    'successors': task_successors
                })
                
                result.append(task_data)
            
            print(f"[DEBUG] Generated {len(result)} tasks")
            return result
            
        elif scenario_id == 'scenario1':
            scenario_result = self.scheduler.scenario_1_csv_headcount()
            if scenario_result and 'priority_list' in scenario_result:
                return self._format_priority_list(scenario_result['priority_list'])
                
        elif scenario_id == 'scenario2':
            scenario_result = self.scheduler.scenario_2_just_in_time_optimization(
                min_mechanics=1, max_mechanics=30,
                min_quality=1, max_quality=10,
                target_lateness=-1,
                tolerance=2
            )
            if scenario_result and 'priority_list' in scenario_result:
                return self._format_priority_list(scenario_result['priority_list'])
                
        elif scenario_id == 'scenario3':
            scenario_result = self.scheduler.scenario_3_multidimensional_optimization(
                min_mechanics=1, max_mechanics=30,
                min_quality=1, max_quality=15,
                max_iterations=300
            )
            if scenario_result and 'priority_list' in scenario_result:
                return self._format_priority_list(scenario_result['priority_list'])
        
        return []

    def _format_priority_list(self, priority_list):
        """Format priority list"""
        result = []
        for task in priority_list:
            formatted_task = {
                'taskId': task.get('task_id', ''),
                'startTime': str(task.get('scheduled_start', '')),
                'endTime': str(task.get('scheduled_end', '')),
                'team': task.get('team', ''),
                'shift': task.get('shift', ''),
                'product_line': task.get('product_line', ''),
                'duration': task.get('duration_minutes', 0),
                'mechanics_required': task.get('mechanics_required', 0),
                'task_type': task.get('task_type', ''),
                'display_name': task.get('display_name', task.get('task_id', '')),
                'dependencies': [],
                'successors': []
            }
            # Handle datetime conversion
            if hasattr(task.get('scheduled_start'), 'isoformat'):
                formatted_task['startTime'] = task['scheduled_start'].isoformat()
            if hasattr(task.get('scheduled_end'), 'isoformat'):
                formatted_task['endTime'] = task['scheduled_end'].isoformat()
            
            result.append(formatted_task)
        return result

    def get_team_tasks(self, team_name: str, scenario: str, shift: str, limit: int) -> List:
        """Get tasks for team"""
        scenario_data = self.get_scenario_data(scenario)
        team_tasks = [t for t in scenario_data if t.get('team') == team_name]
        if shift:
            team_tasks = [t for t in team_tasks if t.get('shift') == shift]
        return team_tasks[:limit] if limit else team_tasks

    def clear_all_scenarios(self):
        """No caching"""
        pass

    def regenerate_scenario(self, scenario_id: str, force: bool = True) -> List[Dict]:
        """Regenerate"""
        self.scheduler = ProductionScheduler('scheduling_data.csv', debug=True)
        self.scheduler.load_data_from_csv()
        return self.get_scenario_data(scenario_id)
'''

    service_path = os.path.join("backend", "services", "scheduler_service.py")

    # Write the fresh content
    with open(service_path, 'w', encoding='utf-8') as f:
        f.write(fresh_content)

    print(f"✅ Created fresh {service_path}")
    print("   File is now clean and should work!")

if __name__ == "__main__":
    fix_encoding()

    print("\n" + "=" * 80)
    print("NEXT STEPS:")
    print("=" * 80)
    print("1. Try running app.py again")
    print("2. If it still fails, type 'y' when prompted to create minimal version")
    print("3. Or run: python create_fresh_scheduler_service.py")