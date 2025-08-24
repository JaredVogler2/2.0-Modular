"""
Tasks API Blueprint
"""
from flask import Blueprint, jsonify, request

tasks_bp = Blueprint('tasks', __name__, url_prefix='/api')

@tasks_bp.route('/tasks/test')
def test():
    """Test endpoint for tasks"""
    return jsonify({'message': 'tasks API is working'})

# TODO: Implement actual endpoints
