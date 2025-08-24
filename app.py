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
# At the TOP of your app.py, right after imports, add this:

import os
import sys

# Force the correct path
FORCE_DIR = r"C:\Users\jared\PycharmProjects\PythonProject2-Aurora2.0-Modular"
if os.path.exists(FORCE_DIR):
    os.chdir(FORCE_DIR)
    sys.path.insert(0, FORCE_DIR)
    print(f"[FORCED] Changed to directory: {os.getcwd()}")

# Verify we're in the right place
current_dir = os.getcwd()
if "PythonProject2-Aurora2.0-Modular" not in current_dir:
    print("=" * 60)
    print("ERROR: Running from WRONG directory!")
    print(f"Current: {current_dir}")
    print(f"Should be: {FORCE_DIR}")
    print("=" * 60)
    sys.exit(1)

# Now create Flask app with absolute paths
from flask import Flask, render_template, jsonify

app = Flask(__name__,
            static_folder=os.path.join(FORCE_DIR, 'static'),
            template_folder=os.path.join(FORCE_DIR, 'templates'))

print(f"[APP] Static folder: {app.static_folder}")
print(f"[APP] Template folder: {app.template_folder}")

# Verify the folders exist
if not os.path.exists(app.static_folder):
    print(f"[ERROR] Static folder does not exist: {app.static_folder}")
if not os.path.exists(app.template_folder):
    print(f"[ERROR] Template folder does not exist: {app.template_folder}")

# List what's in static/js
static_js = os.path.join(app.static_folder, 'js')
if os.path.exists(static_js):
    contents = os.listdir(static_js)
    print(f"[APP] static/js contents: {contents}")

    if 'core' in contents and 'modules' in contents:
        print("[APP] ✓ Correct modular structure found!")
    else:
        print("[APP] ✗ Wrong structure - missing core/modules folders")
        print("[APP] You might be serving from the old project!")

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


# Direct routes for Gantt chart - ALWAYS FRESH
@app.route('/baseline')
def get_baseline():
    """Direct baseline route for Gantt chart - always generates fresh schedule"""
    if not initialized:
        initialize_app()

    print("\n[APP] Baseline route called - generating fresh schedule")
    service = SchedulerService.get_instance()
    data = service.get_scenario_data('baseline')

    print(f"[APP] Generated {len(data)} tasks for baseline")
    if data and len(data) > 0:
        first_task = data[0]
        print(f"[APP] First task starts at: {first_task.get('startTime', 'unknown')}")

    return jsonify({'data': data, 'tasks': data})


@app.route('/scenario1')
def get_scenario1():
    """Direct scenario1 route for Gantt chart - always generates fresh schedule"""
    if not initialized:
        initialize_app()

    print("\n[APP] Scenario1 route called - generating fresh schedule")
    service = SchedulerService.get_instance()
    data = service.get_scenario_data('scenario1')

    print(f"[APP] Generated {len(data)} tasks for scenario1")
    return jsonify({'data': data, 'tasks': data})


@app.route('/scenario2')
def get_scenario2():
    """Direct scenario2 route for Gantt chart - always generates fresh schedule"""
    if not initialized:
        initialize_app()

    print("\n[APP] Scenario2 route called - generating fresh schedule")
    service = SchedulerService.get_instance()
    data = service.get_scenario_data('scenario2')

    print(f"[APP] Generated {len(data)} tasks for scenario2")
    return jsonify({'data': data, 'tasks': data})


@app.route('/scenario3')
def get_scenario3():
    """Direct scenario3 route for Gantt chart - always generates fresh schedule"""
    if not initialized:
        initialize_app()

    print("\n[APP] Scenario3 route called - generating fresh schedule")
    service = SchedulerService.get_instance()
    data = service.get_scenario_data('scenario3')

    print(f"[APP] Generated {len(data)} tasks for scenario3")
    return jsonify({'data': data, 'tasks': data})


# Add this debug route to your app.py to verify file paths

@app.route('/debug/paths')
def debug_paths():
    """Debug endpoint to check what files Flask is serving"""
    import os

    base_dir = os.path.dirname(os.path.abspath(__file__))
    static_dir = app.static_folder
    template_dir = app.template_folder

    # Check static/js structure
    js_structure = {}
    static_js_path = os.path.join(static_dir, 'js') if static_dir else None

    if static_js_path and os.path.exists(static_js_path):
        # Check what's in static/js
        js_contents = os.listdir(static_js_path)
        js_structure['root'] = js_contents

        # Check for core folder
        core_path = os.path.join(static_js_path, 'core')
        if os.path.exists(core_path):
            js_structure['core'] = os.listdir(core_path)

        # Check for modules folder
        modules_path = os.path.join(static_js_path, 'modules')
        if os.path.exists(modules_path):
            js_structure['modules'] = os.listdir(modules_path)

            # Check each module
            for module in os.listdir(modules_path):
                module_path = os.path.join(modules_path, module)
                if os.path.isdir(module_path):
                    js_structure[f'modules/{module}'] = os.listdir(module_path)

    # Check which dashboard.html is being used
    dashboard_path = None
    if template_dir:
        dashboard_html = os.path.join(template_dir, 'dashboard.html')
        if os.path.exists(dashboard_html):
            dashboard_path = dashboard_html
            # Read first few lines to check script paths
            with open(dashboard_html, 'r') as f:
                lines = f.readlines()
                script_lines = [line.strip() for line in lines if '<script' in line][:10]
        else:
            script_lines = ['dashboard.html not found!']
    else:
        script_lines = ['No template directory configured!']

    return jsonify({
        'base_directory': base_dir,
        'static_folder': static_dir,
        'template_folder': template_dir,
        'dashboard_location': dashboard_path,
        'js_structure': js_structure,
        'dashboard_script_tags': script_lines,
        'correct_project': 'PythonProject2-Aurora2.0-Modular' in base_dir,
        'url_map': [str(rule) for rule in app.url_map.iter_rules()]
    })


@app.route('/debug/static-test')
def debug_static_test():
    """Test page to verify correct static files are loading"""
    html = '''
    <!DOCTYPE html>
    <html>
    <head>
        <title>Static File Test</title>
    </head>
    <body>
        <h1>Static File Loading Test</h1>
        <div id="results"></div>

        <script>
            // Test which files are actually loading
            const filesToTest = [
                '/static/js/core/app.js',
                '/static/js/core/event-bus.js',
                '/static/js/core/api-client.js',
                '/static/js/core/base-module.js',
                '/static/js/modules/project/project.js',
                '/static/js/modules/team-lead/team-lead.js',
                // Old structure files (should fail)
                '/static/js/app.js',
                '/static/js/updated-dashboard-js.js'
            ];

            const results = document.getElementById('results');

            async function testFile(url) {
                try {
                    const response = await fetch(url, { method: 'HEAD' });
                    return { url, status: response.status, exists: response.ok };
                } catch (error) {
                    return { url, status: 'error', exists: false };
                }
            }

            async function runTests() {
                results.innerHTML = '<h2>Testing static file paths...</h2>';

                for (const file of filesToTest) {
                    const result = await testFile(file);
                    const color = result.exists ? 'green' : 'red';
                    const symbol = result.exists ? '✓' : '✗';

                    results.innerHTML += `
                        <div style="color: ${color}; margin: 5px 0;">
                            ${symbol} ${result.url} - Status: ${result.status}
                        </div>
                    `;
                }

                // Check actual content of app.js
                try {
                    const coreAppResponse = await fetch('/static/js/core/app.js');
                    if (coreAppResponse.ok) {
                        const content = await coreAppResponse.text();
                        const isModular = content.includes('DashboardApp');
                        results.innerHTML += `
                            <h3>app.js content check:</h3>
                            <div style="color: ${isModular ? 'green' : 'red'}">
                                ${isModular ? '✓ Modular version detected' : '✗ Old version detected'}
                            </div>
                        `;
                    }
                } catch (error) {
                    console.error('Error checking app.js content:', error);
                }
            }

            runTests();
        </script>
    </body>
    </html>
    '''
    return html

@app.route('/debug/fresh')
def debug_fresh_generation():
    """Debug endpoint to verify fresh generation is working"""
    if not initialized:
        initialize_app()

    service = SchedulerService.get_instance()

    # Generate baseline twice and compare
    print("\n[DEBUG] Testing fresh generation...")

    data1 = service.get_scenario_data('baseline')
    print(f"[DEBUG] First generation: {len(data1)} tasks")

    data2 = service.get_scenario_data('baseline')
    print(f"[DEBUG] Second generation: {len(data2)} tasks")

    # Check if they're different instances (they should be)
    same_object = data1 is data2
    same_content = data1 == data2

    return jsonify({
        'message': 'Fresh generation test',
        'first_generation_count': len(data1),
        'second_generation_count': len(data2),
        'are_same_object': same_object,  # Should be False
        'have_same_content': same_content,  # Might be True if deterministic
        'first_task_time': data1[0].get('startTime') if data1 else None,
        'caching_status': 'DISABLED - Always generates fresh schedules'
    })

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