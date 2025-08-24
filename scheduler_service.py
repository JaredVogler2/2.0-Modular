"""
Scheduler Service - Real version using scheduler.py
"""
import logging
from typing import Dict, List
from datetime import datetime
from pathlib import Path
import sys

# Add the parent directory to path
sys.path.append(str(Path(__file__).parent.parent.parent))

# Import the real scheduler
from scheduler import ProductionScheduler

logger = logging.getLogger(__name__)

class SchedulerService:
    """Real scheduler service using ProductionScheduler"""

    _instance = None

    def __init__(self):
        self.scheduler = None
        self.initialized = False

    @classmethod
    def get_instance(cls):
        """Get singleton instance"""
        if cls._instance is None:
            cls._instance = cls()
        return cls._instance

    @classmethod
    def initialize(cls):
        """Initialize the scheduler service"""
        instance = cls.get_instance()
        if not instance.initialized:
            logger.info("Initializing scheduler service...")
            try:
                instance.scheduler = ProductionScheduler('scheduling_data.csv', debug=False)
                instance.scheduler.load_data_from_csv()
                instance.initialized = True
                logger.info("Scheduler service initialized with real data")
            except Exception as e:
                logger.error(f"Failed to initialize scheduler: {e}")
                instance.initialized = False

    def get_scenario_data(self, scenario_id: str) -> List[Dict]:
        """Get fresh scheduling data for a scenario"""
        if not self.initialized or not self.scheduler:
            print(f"[WARNING] Scheduler not initialized")
            return []

        print(f"[DEBUG] Generating fresh schedule for {scenario_id}")

        # Generate fresh schedule each time
        self.scheduler.task_schedule = {}
        self.scheduler._critical_path_cache = {}

        # Generate schedule based on scenario
        if scenario_id == 'baseline':
            priority_list = self.scheduler.generate_global_priority_list(allow_late_delivery=True, silent_mode=True)
        else:
            # For other scenarios, you can add different logic
            priority_list = self.scheduler.generate_global_priority_list(allow_late_delivery=True, silent_mode=True)

        # Convert to Gantt format
        tasks = []
        for task in priority_list[:50]:  # Limit to first 50 for performance
            tasks.append({
                'taskId': task['task_id'],
                'task_type': task['task_type'],
                'display_name': task['display_name'],
                'startTime': task['scheduled_start'].isoformat(),
                'endTime': task['scheduled_end'].isoformat(),
                'duration': task['duration_minutes'],
                'team': task['team'],
                'product_line': task['product_line']
            })

        print(f"[DEBUG] Generated {len(tasks)} tasks for {scenario_id}")
        return tasks

    def clear_all_scenarios(self):
        """Clear all cached scenarios"""
        if self.scheduler:
            self.scheduler.task_schedule = {}
            self.scheduler._critical_path_cache = {}

    def regenerate_scenario(self, scenario_id: str, force: bool = True) -> List[Dict]:
        """Force regenerate scenario"""
        return self.get_scenario_data(scenario_id)