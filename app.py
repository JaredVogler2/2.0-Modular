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

@app.errorhandler(404)
def not_found(error):
    return jsonify({'error': 'Not found'}), 404

@app.errorhandler(500)
def internal_error(error):
    logger.error(f"Internal error: {error}")
    return jsonify({'error': 'Internal server error'}), 500

if __name__ == '__main__':
    # Initialize before starting the server
    initialize_app()

    logger.info(f"Starting Production Dashboard on {config.HOST}:{config.PORT}")
    app.run(
        debug=config.DEBUG,
        host=config.HOST,
        port=config.PORT
    )