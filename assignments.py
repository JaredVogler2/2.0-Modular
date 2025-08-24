"""
Assignments API Blueprint
"""
from flask import Blueprint, jsonify, request

assignments_bp = Blueprint('assignments', __name__, url_prefix='/api')

@assignments_bp.route('/assignments/test')
def test():
    """Test endpoint for assignments"""
    return jsonify({'message': 'assignments API is working'})

# TODO: Implement actual endpoints
