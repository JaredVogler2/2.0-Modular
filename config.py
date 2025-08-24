"""
Configuration settings for Production Dashboard
"""
import os
from pathlib import Path

# Base configuration
BASE_DIR = Path(__file__).resolve().parent
DATA_DIR = BASE_DIR / "data"
EXPORT_DIR = BASE_DIR / "exports"
LOG_DIR = BASE_DIR / "logs"

# Flask configuration
DEBUG = True
SECRET_KEY = 'your-secret-key-change-in-production'
HOST = '0.0.0.0'
PORT = 5000

# Scheduler configuration
SCHEDULER_CONFIG = {
    'csv_file': 'scheduling_data.csv',
    'late_part_delay_days': 1.0,
    'debug_mode': False
}

# API configuration
API_CONFIG = {
    'timeout': 30,
    'max_retries': 3,
    'cache_ttl': 300  # 5 minutes
}

# Ensure directories exist
for directory in [DATA_DIR, EXPORT_DIR, LOG_DIR]:
    directory.mkdir(exist_ok=True)
