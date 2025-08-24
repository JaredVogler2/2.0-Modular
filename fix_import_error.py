"""
Run this script to diagnose and fix the import error
Save in PythonProject2-Aurora2.0-Modular directory
"""
import os
import sys
import ast

def check_scheduler_service():
    """Check if scheduler_service.py has syntax errors"""
    
    print("=" * 80)
    print("DIAGNOSING IMPORT ERROR")
    print("=" * 80)
    
    # 1. Check if file exists
    service_path = os.path.join("backend", "services", "scheduler_service.py")
    if not os.path.exists(service_path):
        print(f"❌ File not found: {service_path}")
        return False
    
    print(f"✅ File exists: {service_path}")
    
    # 2. Check for syntax errors
    print("\nChecking for syntax errors...")
    try:
        with open(service_path, 'r') as f:
            content = f.read()
        
        # Try to parse the file
        ast.parse(content)
        print("✅ No syntax errors found")
        
        # Check if class exists
        if "class SchedulerService" in content:
            print("✅ SchedulerService class found")
        else:
            print("❌ SchedulerService class NOT found!")
            return False
            
    except SyntaxError as e:
        print(f"❌ Syntax error in file: {e}")
        print(f"   Line {e.lineno}: {e.text}")
        return False
    except Exception as e:
        print(f"❌ Error reading file: {e}")
        return False
    
    # 3. Check __init__.py files
    print("\nChecking __init__.py files...")
    
    init_files = [
        "backend/__init__.py",
        "backend/services/__init__.py",
        "backend/api/__init__.py"
    ]
    
    for init_file in init_files:
        if os.path.exists(init_file):
            size = os.path.getsize(init_file)
            print(f"✅ {init_file} exists ({size} bytes)")
        else:
            print(f"⚠️  {init_file} missing - creating...")
            os.makedirs(os.path.dirname(init_file), exist_ok=True)
            with open(init_file, 'w') as f:
                f.write('"""Package initialization"""\n')
            print(f"   ✅ Created {init_file}")
    
    # 4. Test import directly
    print("\nTesting import...")
    try:
        # Add current directory to path
        sys.path.insert(0, os.getcwd())
        
        # Try to import
        from backend.services.scheduler_service import SchedulerService
        print("✅ Import successful!")
        print(f"   SchedulerService class: {SchedulerService}")
        return True
        
    except ImportError as e:
        print(f"❌ Import failed: {e}")
        
        # Try to get more details
        print("\nTrying alternative import to get more info...")
        try:
            import backend.services.scheduler_service as module
            print(f"Module imported: {module}")
            print(f"Module contents: {dir(module)}")
            
            if 'SchedulerService' not in dir(module):
                print("❌ SchedulerService not in module!")
                print("   Available: ", [x for x in dir(module) if not x.startswith('_')])
        except Exception as e2:
            print(f"   Alternative import also failed: {e2}")
        
        return False
    except Exception as e:
        print(f"❌ Unexpected error: {e}")
        return False

def create_minimal_scheduler_service():
    """Create a minimal working scheduler_service.py"""
    
    print("\n" + "=" * 80)
    print("CREATING MINIMAL SCHEDULER SERVICE")
    print("=" * 80)
    
    minimal_code = '''"""
Scheduler Service - Minimal working version
"""
import logging
from typing import Dict, List
from pathlib import Path
import sys

# Add the parent directory to path to import scheduler
sys.path.append(str(Path(__file__).parent.parent.parent))

# Import with error handling
try:
    from scheduler import ProductionScheduler
except ImportError as e:
    print(f"Warning: Could not import ProductionScheduler: {e}")
    ProductionScheduler = None

logger = logging.getLogger(__name__)

class SchedulerService:
    """Minimal scheduler service for testing"""
    
    _instance = None
    
    def __init__(self):
        self.scheduler = None
        self.initialized = False
    
    @classmethod
    def get_instance(cls):
        """Get singleton instance"""
        if cls._instance is None:
            cls._instance = cls()
        return cls._instance
    
    @classmethod
    def initialize(cls):
        """Initialize the scheduler service"""
        instance = cls.get_instance()
        if not instance.initialized:
            logger.info("Initializing scheduler service...")
            
            if ProductionScheduler:
                try:
                    instance.scheduler = ProductionScheduler('scheduling_data.csv', debug=True)
                    instance.scheduler.load_data_from_csv()
                    instance.initialized = True
                    logger.info("Scheduler service initialized")
                except Exception as e:
                    logger.error(f"Failed to initialize scheduler: {e}")
                    instance.initialized = False
            else:
                logger.warning("ProductionScheduler not available")
                instance.initialized = False
    
    def get_scenario_data(self, scenario_id: str) -> List:
        """Get data for a specific scenario"""
        print(f"[DEBUG] get_scenario_data called for {scenario_id}")
        
        if not self.initialized or not self.scheduler:
            print(f"[WARNING] Scheduler not initialized, returning empty list")
            return []
        
        # For now, return empty list to test import
        return []
    
    def clear_all_scenarios(self):
        """Clear scenarios (no-op for minimal version)"""
        pass
    
    def regenerate_scenario(self, scenario_id: str, force: bool = True) -> List[Dict]:
        """Regenerate scenario"""
        return self.get_scenario_data(scenario_id)
'''
    
    backup_path = "backend/services/scheduler_service.py.backup"
    service_path = "backend/services/scheduler_service.py"
    
    # Backup existing file
    if os.path.exists(service_path):
        import shutil
        shutil.copy2(service_path, backup_path)
        print(f"✅ Backed up existing file to {backup_path}")
    
    # Write minimal version
    with open(service_path, 'w') as f:
        f.write(minimal_code)
    
    print(f"✅ Created minimal {service_path}")
    print("   This should fix the import error")
    print(f"   Your original file is backed up at {backup_path}")

def main():
    """Main diagnostic function"""
    
    # Check current directory
    current_dir = os.getcwd()
    if "PythonProject2-Aurora2.0-Modular" not in current_dir:
        print(f"⚠️  Warning: Not in modular project directory")
        print(f"   Current: {current_dir}")
    
    # Run diagnostics
    success = check_scheduler_service()
    
    if not success:
        print("\n" + "=" * 80)
        response = input("Create minimal working scheduler_service.py? (y/n): ")
        if response.lower() == 'y':
            create_minimal_scheduler_service()
            print("\n✅ Try running app.py again now")
        else:
            print("\nManual fix needed:")
            print("1. Check backend/services/scheduler_service.py for syntax errors")
            print("2. Make sure the class SchedulerService is defined")
            print("3. Ensure all __init__.py files exist")
    else:
        print("\n✅ Everything looks good! Try running app.py again")

if __name__ == "__main__":
    main()