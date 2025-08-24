"""
Scenarios API Blueprint
"""
from flask import Blueprint, jsonify, request

scenarios_bp = Blueprint('scenarios', __name__, url_prefix='/api')

@scenarios_bp.route('/scenarios/test')
def test():
    """Test endpoint for scenarios"""
    return jsonify({'message': 'scenarios API is working'})

# TODO: Implement actual endpoints
