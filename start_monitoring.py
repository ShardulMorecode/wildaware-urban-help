#!/usr/bin/env python3
"""
Simple starter script for wildlife monitoring
Run this to start monitoring PDF reports in real-time
"""

import os
import sys
import subprocess
import time
from pathlib import Path

def check_requirements():
    """Check if required packages are installed"""
    required_packages = ['PyPDF2', 'watchdog']
    missing_packages = []
    
    for package in required_packages:
        try:
            __import__(package)
        except ImportError:
            missing_packages.append(package)
    
    if missing_packages:
        print(f"Missing packages: {', '.join(missing_packages)}")
        print("Installing missing packages...")
        subprocess.check_call([sys.executable, '-m', 'pip', 'install'] + missing_packages)
        print("Packages installed successfully!")

def setup_directories():
    """Ensure required directories exist"""
    reports_dir = Path('./src/reports')
    public_dir = Path('./public')
    
    reports_dir.mkdir(parents=True, exist_ok=True)
    public_dir.mkdir(parents=True, exist_ok=True)
    
    print(f"Reports directory: {reports_dir.absolute()}")
    print(f"Public directory: {public_dir.absolute()}")

def main():
    """Main function to start monitoring"""
    print("Wildlife Report Monitoring Setup")
    print("=" * 40)
    
    # Check and install requirements
    check_requirements()
    
    # Setup directories
    setup_directories()
    
    # Start the monitoring script
    print("\nStarting monitoring script...")
    print("Put PDF reports in src/reports folder to see them in the Wildlife Monitoring panel")
    print("Press Ctrl+C to stop monitoring")
    
    try:
        # Run the pathway monitor script
        subprocess.run([sys.executable, 'pathway_monitor.py'], check=True)
    except KeyboardInterrupt:
        print("\nMonitoring stopped by user")
    except subprocess.CalledProcessError as e:
        print(f"Error running monitoring script: {e}")
        print("Make sure pathway_monitor.py exists in the current directory")

if __name__ == "__main__":
    main()