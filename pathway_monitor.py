#!/usr/bin/env python3
"""
Pathway Framework Integration for Wildlife Report Monitoring
This script monitors PDF files in the reports folder and processes them in real-time.

Requirements:
- pip install pathway pandas PyPDF2 watchdog

Usage:
- Windows: python pathway_monitor.py
- Linux/Mac: ./pathway_monitor.py

For Windows deployment, ensure:
1. Python 3.8+ is installed
2. Reports folder exists: C:\WildlifeReports\
3. Run with elevated permissions if needed
"""

import os
import sys
import json
import time
import logging
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Any
import pandas as pd

try:
    import pathway as pw
    from pathway.xpacks.connectors import fs
    import PyPDF2
    from watchdog.observers import Observer
    from watchdog.events import FileSystemEventHandler
except ImportError as e:
    print(f"Missing required packages: {e}")
    print("Please install: pip install pathway pandas PyPDF2 watchdog")
    sys.exit(1)

# Configuration
REPORTS_FOLDER = os.getenv('REPORTS_PATH', './src/reports')
OUTPUT_JSON = os.getenv('OUTPUT_PATH', './public/monitoring_data.json')
POLL_INTERVAL = int(os.getenv('POLL_INTERVAL', '5'))  # seconds - faster for development

# Windows-specific paths
if os.name == 'nt':  # Windows
    # For local development, use relative paths to the project
    REPORTS_FOLDER = os.getenv('REPORTS_PATH', './src/reports')
    OUTPUT_JSON = os.getenv('OUTPUT_PATH', './public/monitoring_data.json')

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('pathway_monitor.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

class PDFParser:
    """Parse PDF reports and extract structured data"""
    
    @staticmethod
    def extract_text_from_pdf(pdf_path: str) -> str:
        """Extract text content from PDF file"""
        try:
            with open(pdf_path, 'rb') as file:
                pdf_reader = PyPDF2.PdfReader(file)
                text = ""
                for page in pdf_reader.pages:
                    text += page.extract_text()
                return text
        except Exception as e:
            logger.error(f"Error reading PDF {pdf_path}: {e}")
            return ""
    
    @staticmethod
    def parse_report_data(text: str, filename: str) -> Dict[str, Any]:
        """Parse structured data from report text"""
        data = {
            'id': filename.replace('.pdf', ''),
            'filename': filename,
            'timestamp': datetime.now().isoformat(),
            'observer_name': '',
            'species': '',
            'city': '',
            'location': '',
            'date': '',
            'time': '',
            'urgency_level': '',
            'weather': '',
            'animal_behavior': '',
            'description': ''
        }
        
        # Extract data using simple text parsing
        lines = text.split('\n')
        for line in lines:
            line = line.strip()
            if 'Observer Name:' in line:
                data['observer_name'] = line.split('Observer Name:')[-1].strip()
            elif 'Date:' in line and not data['date']:
                data['date'] = line.split('Date:')[-1].strip()
            elif 'Time:' in line:
                data['time'] = line.split('Time:')[-1].strip()
            elif 'Wildlife Species:' in line:
                data['species'] = line.split('Wildlife Species:')[-1].strip()
            elif 'City:' in line:
                data['city'] = line.split('City:')[-1].strip()
            elif 'Specific Location:' in line:
                data['location'] = line.split('Specific Location:')[-1].strip()
            elif 'Weather Conditions:' in line:
                data['weather'] = line.split('Weather Conditions:')[-1].strip()
            elif 'Animal Behavior:' in line:
                data['animal_behavior'] = line.split('Animal Behavior:')[-1].strip()
            elif 'Urgency Level:' in line:
                data['urgency_level'] = line.split('Urgency Level:')[-1].strip()
            elif 'Description:' in line:
                # Get the description from the remaining text
                desc_index = text.find('Description:')
                if desc_index != -1:
                    desc_text = text[desc_index + len('Description:'):].strip()
                    # Take up to the next field or end
                    end_markers = ['Generated on:', '\n\n\n']
                    for marker in end_markers:
                        if marker in desc_text:
                            desc_text = desc_text.split(marker)[0].strip()
                    data['description'] = desc_text
        
        return data

class WildlifeReportMonitor:
    """Main monitoring class using Pathway framework"""
    
    def __init__(self, reports_folder: str, output_path: str):
        self.reports_folder = Path(reports_folder)
        self.output_path = Path(output_path)
        self.parser = PDFParser()
        self.processed_files = set()
        
        # Ensure directories exist
        self.reports_folder.mkdir(parents=True, exist_ok=True)
        self.output_path.parent.mkdir(parents=True, exist_ok=True)
        
        logger.info(f"Monitoring folder: {self.reports_folder}")
        logger.info(f"Output file: {self.output_path}")
    
    def setup_pathway_pipeline(self):
        """Setup Pathway data processing pipeline"""
        try:
            # Create Pathway input connector for file monitoring
            input_table = pw.io.fs.read(
                self.reports_folder,
                format="binary",
                mode="streaming",
                with_metadata=True,
                autocommit_duration_ms=1000
            )
            
            # Process PDF files
            processed_table = input_table.select(
                filename=pw.this.path,
                content=pw.this.data,
                modified_time=pw.this.modified_time
            ).filter(
                pw.this.filename.str.endswith('.pdf')
            )
            
            # Output processed data
            pw.io.jsonlines.write(processed_table, self.output_path)
            
            return processed_table
            
        except Exception as e:
            logger.error(f"Error setting up Pathway pipeline: {e}")
            return None
    
    def process_pdf_file(self, file_path: Path) -> Dict[str, Any]:
        """Process a single PDF file"""
        try:
            if file_path.name in self.processed_files:
                return None
            
            logger.info(f"Processing: {file_path.name}")
            
            # Extract text from PDF
            text = self.parser.extract_text_from_pdf(str(file_path))
            
            if not text:
                logger.warning(f"No text extracted from {file_path.name}")
                return None
            
            # Parse structured data
            data = self.parser.parse_report_data(text, file_path.name)
            data['file_path'] = str(file_path)
            data['file_size'] = file_path.stat().st_size
            data['last_modified'] = datetime.fromtimestamp(
                file_path.stat().st_mtime
            ).isoformat()
            
            self.processed_files.add(file_path.name)
            logger.info(f"Successfully processed: {file_path.name}")
            
            return data
            
        except Exception as e:
            logger.error(f"Error processing {file_path}: {e}")
            return None
    
    def scan_existing_files(self) -> List[Dict[str, Any]]:
        """Scan existing PDF files in the reports folder"""
        reports = []
        
        if not self.reports_folder.exists():
            logger.warning(f"Reports folder does not exist: {self.reports_folder}")
            return reports
        
        pdf_files = list(self.reports_folder.glob("*.pdf"))
        logger.info(f"Found {len(pdf_files)} PDF files to process")
        
        for pdf_file in pdf_files:
            data = self.process_pdf_file(pdf_file)
            if data:
                reports.append(data)
        
        return reports
    
    def save_monitoring_data(self, reports: List[Dict[str, Any]]):
        """Save monitoring data to JSON file"""
        try:
            output_data = {
                'last_updated': datetime.now().isoformat(),
                'total_reports': len(reports),
                'reports': reports
            }
            
            with open(self.output_path, 'w', encoding='utf-8') as f:
                json.dump(output_data, f, indent=2, ensure_ascii=False)
            
            logger.info(f"Saved {len(reports)} reports to {self.output_path}")
            
        except Exception as e:
            logger.error(f"Error saving monitoring data: {e}")
    
    def run_monitoring_loop(self):
        """Run continuous monitoring loop"""
        logger.info("Starting wildlife report monitoring...")
        
        while True:
            try:
                # Scan for new/updated files
                reports = self.scan_existing_files()
                
                # Save current data
                self.save_monitoring_data(reports)
                
                # Wait before next scan
                time.sleep(POLL_INTERVAL)
                
            except KeyboardInterrupt:
                logger.info("Monitoring stopped by user")
                break
            except Exception as e:
                logger.error(f"Error in monitoring loop: {e}")
                time.sleep(5)  # Wait before retrying

class FileChangeHandler(FileSystemEventHandler):
    """Handle file system events for real-time monitoring"""
    
    def __init__(self, monitor: WildlifeReportMonitor):
        self.monitor = monitor
    
    def on_created(self, event):
        if not event.is_directory and event.src_path.endswith('.pdf'):
            logger.info(f"New PDF detected: {event.src_path}")
            file_path = Path(event.src_path)
            data = self.monitor.process_pdf_file(file_path)
            if data:
                # Update monitoring data
                reports = self.monitor.scan_existing_files()
                self.monitor.save_monitoring_data(reports)
    
    def on_modified(self, event):
        if not event.is_directory and event.src_path.endswith('.pdf'):
            logger.info(f"PDF modified: {event.src_path}")
            # Remove from processed files to reprocess
            file_name = Path(event.src_path).name
            self.monitor.processed_files.discard(file_name)

def main():
    """Main function"""
    print("Wildlife Report Monitoring with Pathway Framework")
    print("=" * 50)
    
    # Create monitor instance
    monitor = WildlifeReportMonitor(REPORTS_FOLDER, OUTPUT_JSON)
    
    # Setup Pathway pipeline (if available)
    pipeline = monitor.setup_pathway_pipeline()
    
    if pipeline:
        logger.info("Using Pathway framework for real-time processing")
        # Run Pathway processing
        pw.run()
    else:
        logger.info("Using fallback polling-based monitoring")
        
        # Setup file system watcher for real-time detection
        event_handler = FileChangeHandler(monitor)
        observer = Observer()
        observer.schedule(event_handler, str(monitor.reports_folder), recursive=False)
        observer.start()
        
        try:
            # Run monitoring loop
            monitor.run_monitoring_loop()
        finally:
            observer.stop()
            observer.join()

if __name__ == "__main__":
    main()