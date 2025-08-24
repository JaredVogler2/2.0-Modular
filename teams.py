"""
Teams API Blueprint
"""
from flask import Blueprint, jsonify, request

teams_bp = Blueprint('teams', __name__, url_prefix='/api')

@teams_bp.route('/teams/test')
def test():
    """Test endpoint for teams"""
    return jsonify({'message': 'teams API is working'})

# TODO: Implement actual endpoints
