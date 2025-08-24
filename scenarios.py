"""
Scenarios API Blueprint
"""
from flask import Blueprint, jsonify, request
from backend.services.scheduler_service import SchedulerService

scenarios_bp = Blueprint('scenarios', __name__, url_prefix='/api')

@scenarios_bp.route('/scenarios')
def get_scenarios():
    """Get list of available scenarios"""
    return jsonify(['baseline', 'scenario1', 'scenario2', 'scenario3'])

@scenarios_bp.route('/scenario/<scenario_id>')
def get_scenario_data(scenario_id):
    """Get scheduling data for a specific scenario"""
    try:
        service = SchedulerService.get_instance()
        data = service.get_scenario_data(scenario_id)

        # Convert datetime objects to strings for JSON serialization
        serializable_data = []
        for task in data:
            task_copy = task.copy()
            if 'scheduled_start' in task_copy and hasattr(task_copy['scheduled_start'], 'isoformat'):
                task_copy['scheduled_start'] = task_copy['scheduled_start'].isoformat()
            if 'scheduled_end' in task_copy and hasattr(task_copy['scheduled_end'], 'isoformat'):
                task_copy['scheduled_end'] = task_copy['scheduled_end'].isoformat()
            serializable_data.append(task_copy)

        return jsonify({
            'success': True,
            'data': serializable_data,
            'count': len(serializable_data)
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@scenarios_bp.route('/scenarios/test')
def test():
    """Test endpoint for scenarios"""
    return jsonify({'message': 'scenarios API is working'})


@scenarios_bp.route('/scenario/<scenario_id>/refresh', methods=['POST'])
def refresh_scenario(scenario_id):
    """Force refresh a scenario"""
    try:
        service = SchedulerService.get_instance()
        data = service.regenerate_scenario(scenario_id, force=True)

        # Convert datetime objects
        serializable_data = []
        for task in data:
            task_copy = task.copy()
            if 'scheduled_start' in task_copy and hasattr(task_copy['scheduled_start'], 'isoformat'):
                task_copy['scheduled_start'] = task_copy['scheduled_start'].isoformat()
            if 'scheduled_end' in task_copy and hasattr(task_copy['scheduled_end'], 'isoformat'):
                task_copy['scheduled_end'] = task_copy['scheduled_end'].isoformat()
            serializable_data.append(task_copy)

        return jsonify({
            'success': True,
            'message': f'Scenario {scenario_id} refreshed',
            'data': serializable_data,
            'count': len(serializable_data)
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500