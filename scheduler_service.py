"""
Scheduler Service - Interface to the scheduling engine
"""
import logging
from typing import Dict, List, Optional
import threading
from pathlib import Path
import sys

# Add the parent directory to path to import scheduler
sys.path.append(str(Path(__file__).parent.parent.parent))
from scheduler import ProductionScheduler

logger = logging.getLogger(__name__)

class SchedulerService:
    """Singleton service for managing scheduler instances"""

    _instance = None
    _lock = threading.Lock()

    def __init__(self):
        self.scheduler = None
        self.scenario_results = {}
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

            # Initialize the scheduler
            instance.scheduler = ProductionScheduler('scheduling_data.csv', debug=True)
            instance.scheduler.load_data_from_csv()

            # Don't pre-generate baseline - let it generate on demand
            # This ensures we always get fresh results

            instance.initialized = True
            logger.info("Scheduler service initialized with actual scheduler")

    def get_scenario_data(self, scenario_id: str) -> List:
        """Get data for a specific scenario"""

        # ALWAYS clear baseline for now (remove after fixing)
        if scenario_id == 'baseline' and scenario_id in self.scenario_results:
            del self.scenario_results[scenario_id]
            print(f"[DEBUG] Force cleared cached {scenario_id}")

        # For debugging - ALWAYS regenerate baseline, don't use cache
        if scenario_id == 'baseline':
            # Force complete fresh scheduler for baseline
            print("[DEBUG] Creating fresh scheduler instance for baseline")
            self.scheduler = ProductionScheduler('scheduling_data.csv', debug=True)
            self.scheduler.load_data_from_csv()
            self.scheduler.schedule_tasks(silent_mode=True)

            # DEBUG: Check E_23 and related tasks
            print("\n[DEBUG] ========== E_23 RELATIONSHIP CHECK ==========")

            # Check what was actually scheduled
            tasks_to_check = ['E_5', 'E_11', 'E_23', 'E_30']
            for task_id in tasks_to_check:
                if task_id in self.scheduler.task_schedule:
                    sched = self.scheduler.task_schedule[task_id]
                    print(f"[DEBUG] {task_id} scheduled: {sched['start_time']} to {sched['end_time']}")

            # Check dependencies from the scheduler's perspective
            print("\n[DEBUG] Dependencies (from build_dynamic_dependencies):")
            dynamic_constraints = self.scheduler.build_dynamic_dependencies()
            for constraint in dynamic_constraints:
                if constraint['Second'] in tasks_to_check or constraint['First'] in tasks_to_check:
                    print(
                        f"  {constraint['First']} -> {constraint['Second']} ({constraint.get('Relationship', 'F<=S')})")

            # Build predecessor/successor lists for E_23
            predecessors = []
            successors = []
            for constraint in dynamic_constraints:
                if constraint['Second'] == 'E_23':
                    predecessors.append({
                        'task': constraint['First'],
                        'relationship': constraint.get('Relationship', 'Finish <= Start')
                    })
                if constraint['First'] == 'E_23':
                    successors.append({
                        'task': constraint['Second'],
                        'relationship': constraint.get('Relationship', 'Finish <= Start')
                    })

            print(f"\n[DEBUG] E_23 Predecessors: {predecessors}")
            print(f"[DEBUG] E_23 Successors: {successors}")

            # Check if F<=F constraint is satisfied
            if 'E_11' in self.scheduler.task_schedule and 'E_23' in self.scheduler.task_schedule:
                e11_end = self.scheduler.task_schedule['E_11']['end_time']
                e23_end = self.scheduler.task_schedule['E_23']['end_time']
                print(f"\n[DEBUG] F<=F Check: E_11 ends at {e11_end}, E_23 ends at {e23_end}")
                print(f"[DEBUG] Constraint satisfied? {e11_end <= e23_end}")

            print("[DEBUG] ========================================\n")

            # Convert the task_schedule to the format expected by frontend
            result = []
            for task_id, schedule_info in self.scheduler.task_schedule.items():
                # Get the base task data
                task_data = self.scheduler.tasks[task_id].copy()

                # Build dependencies and successors for this task
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

                # Update with scheduled data
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

                # Debug output for E_11 and E_23
                if task_id in ['E_11', 'E_23']:
                    print(
                        f"[DEBUG] Adding to result - {task_id}: {schedule_info['start_time']} to {schedule_info['end_time']}")

                result.append(task_data)

            print(f"[DEBUG] Total tasks in result: {len(result)}")

            # DON'T cache for now - always return fresh
            # self.scenario_results[scenario_id] = result
            return result

        # Check cache for other scenarios
        if scenario_id in self.scenario_results:
            return self.scenario_results[scenario_id]

        # Generate other scenarios on demand
        if self.scheduler:
            logger.info(f"Generating scenario: {scenario_id}")

            if scenario_id == 'scenario1':
                # Scenario 1: CSV Headcount
                scenario_result = self.scheduler.scenario_1_csv_headcount()
                if scenario_result and 'priority_list' in scenario_result:
                    self.scenario_results[scenario_id] = scenario_result['priority_list']
                    return scenario_result['priority_list']

            elif scenario_id == 'scenario2':
                # Scenario 2: Just-in-Time Optimization
                scenario_result = self.scheduler.scenario_2_just_in_time_optimization()
                if scenario_result and 'priority_list' in scenario_result:
                    self.scenario_results[scenario_id] = scenario_result['priority_list']
                    return scenario_result['priority_list']

            elif scenario_id == 'scenario3':
                # Scenario 3: Multidimensional Optimization
                scenario_result = self.scheduler.scenario_3_multidimensional_optimization()
                if scenario_result and 'priority_list' in scenario_result:
                    self.scenario_results[scenario_id] = scenario_result['priority_list']
                    return scenario_result['priority_list']

            else:
                # Unknown scenario - fall back to baseline
                logger.warning(f"Unknown scenario '{scenario_id}', using baseline")
                return self.get_scenario_data('baseline')

        # If no scheduler available, return empty list
        logger.error(f"No scheduler available for scenario {scenario_id}")
        return []

    def get_team_tasks(self, team_name: str, scenario: str, shift: str, limit: int) -> List:
        """Get tasks for a specific team"""
        scenario_data = self.get_scenario_data(scenario)
        team_tasks = [task for task in scenario_data if task.get('team') == team_name]
        if shift:
            team_tasks = [task for task in team_tasks if task.get('shift') == shift]
        return team_tasks[:limit] if limit else team_tasks

    def clear_all_scenarios(self):
        """Clear all cached scenario results"""
        self.scenario_results = {}
        print("[DEBUG] Cleared all cached scenario results")

    def regenerate_scenario(self, scenario_id: str, force: bool = True) -> List[Dict]:
        """Force regeneration of a scenario"""
        if force and scenario_id in self.scenario_results:
            del self.scenario_results[scenario_id]
            logger.info(f"Cleared cached results for scenario: {scenario_id}")

        # Re-initialize scheduler to get fresh state
        logger.info("Re-initializing scheduler for fresh generation...")
        self.scheduler = ProductionScheduler('scheduling_data.csv', debug=True)
        self.scheduler.load_data_from_csv()

        return self.get_scenario_data(scenario_id)