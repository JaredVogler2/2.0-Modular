"""
Main Flask application with modular architecture
"""
from flask import Flask, render_template, jsonify
from flask_cors import CORS
import config
from backend.api import scenarios, teams, tasks, analytics, assignments
from backend.services.scheduler_service import SchedulerService
import logging
from datetime import datetime

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler(config.LOG_DIR / f'app_{datetime.now().strftime("%Y%m%d")}.log'),
        logging.StreamHandler()
    ]
)

logger = logging.getLogger(__name__)

# Create Flask app
app = Flask(__name__)
app.config.from_object(config)
CORS(app)

# Initialize scheduler service (one-time initialization)
initialized = False

def initialize_app():
    """Initialize the scheduler service"""
    global initialized
    if not initialized:
        logger.info("Initializing scheduler service...")
        SchedulerService.initialize()
        SchedulerService.get_instance().clear_all_scenarios()  # Clear old cached results
        logger.info("Scheduler service initialized successfully")
        initialized = True


# Register blueprints
app.register_blueprint(scenarios.scenarios_bp)
app.register_blueprint(teams.teams_bp)
app.register_blueprint(tasks.tasks_bp)
app.register_blueprint(analytics.analytics_bp)
app.register_blueprint(assignments.assignments_bp)

@app.route('/')
def index():
    """Serve the main dashboard page"""
    return render_template('dashboard.html')

@app.route('/health')
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'timestamp': datetime.now().isoformat()
    })

# Direct routes for Gantt chart (backward compatibility)
@app.route('/baseline')
def get_baseline():
    """Direct baseline route for Gantt chart"""
    if not initialized:
        initialize_app()
    service = SchedulerService.get_instance()
    data = service.get_scenario_data('baseline')
    return jsonify({'data': data, 'tasks': data})

@app.route('/scenario1')
def get_scenario1():
    """Direct scenario1 route for Gantt chart"""
    if not initialized:
        initialize_app()
    service = SchedulerService.get_instance()
    data = service.get_scenario_data('scenario1')
    return jsonify({'data': data, 'tasks': data})

@app.route('/scenario2')
def get_scenario2():
    """Direct scenario2 route for Gantt chart"""
    if not initialized:
        initialize_app()
    service = SchedulerService.get_instance()
    data = service.get_scenario_data('scenario2')
    return jsonify({'data': data, 'tasks': data})

@app.route('/scenario3')
def get_scenario3():
    """Direct scenario3 route for Gantt chart"""
    if not initialized:
        initialize_app()
    service = SchedulerService.get_instance()
    data = service.get_scenario_data('scenario3')
    return jsonify({'data': data, 'tasks': data})

@app.route('/debug/schedule')
def debug_schedule():
    """Debug endpoint to check scheduler status"""
    if not initialized:
        initialize_app()

    service = SchedulerService.get_instance()

    # Get baseline data
    data = service.get_scenario_data('baseline')

    # Find E_11 and E_23 - using correct field names
    e11 = None
    e23 = None

    for task in data:
        if task.get('taskId') == 'E_11':
            e11 = task
        elif task.get('taskId') == 'E_23':
            e23 = task

    return jsonify({
        'total_tasks': len(data),
        'E_11': {
            'start': e11.get('startTime', 'Not found') if e11 else 'Not found',
            'end': e11.get('endTime', 'Not found') if e11 else 'Not found'
        },
        'E_23': {
            'start': e23.get('startTime', 'Not found') if e23 else 'Not found',
            'end': e23.get('endTime', 'Not found') if e23 else 'Not found'
        },
        'constraint_satisfied': 'Check times above'
    })

@app.errorhandler(404)
def not_found(error):
    return jsonify({'error': 'Not found'}), 404

@app.errorhandler(500)
def internal_error(error):
    logger.error(f"Internal error: {error}")
    return jsonify({'error': 'Internal server error'}), 500


if __name__ == '__main__':
    initialize_app()

    # Force a test call to see debug output
    service = SchedulerService.get_instance()
    print("\n[DEBUG] Testing baseline generation...")
    test_data = service.get_scenario_data('baseline')
    print(f"[DEBUG] Generated {len(test_data)} tasks")

    logger.info(f"Starting Production Dashboard on {config.HOST}:{config.PORT}")
    app.run(
        debug=True,
        host='0.0.0.0',
        port=5000
    )