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
    import PyPDF2
    from watchdog.observers import Observer
    from watchdog.events import FileSystemEventHandler
except ImportError as e:
    print(f"Missing required packages: {e}")
    print("Please install: pip install PyPDF2 watchdog")
    sys.exit(1)

# Configuration
REPORTS_FOLDER = os.getenv('REPORTS_PATH', './src/reports')
OUTPUT_JSON = os.getenv('OUTPUT_PATH', './public/monitoring_data.json')
POLL_INTERVAL = int(os.getenv('POLL_INTERVAL', '2'))  # seconds - faster for development

# Ensure absolute paths for proper monitoring
REPORTS_FOLDER = os.path.abspath(REPORTS_FOLDER)
OUTPUT_JSON = os.path.abspath(OUTPUT_JSON)

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
            logger.info(f"Attempting to read PDF: {pdf_path}")
            with open(pdf_path, 'rb') as file:
                pdf_reader = PyPDF2.PdfReader(file)
                logger.info(f"PDF has {len(pdf_reader.pages)} pages")
                text = ""
                for i, page in enumerate(pdf_reader.pages):
                    page_text = page.extract_text()
                    logger.info(f"Page {i+1} extracted {len(page_text)} characters")
                    text += page_text + "\n"
                logger.info(f"Total extracted text: {len(text)} characters")
                return text
        except Exception as e:
            logger.error(f"Error reading PDF {pdf_path}: {e}")
            import traceback
            logger.error(f"Full traceback: {traceback.format_exc()}")
            return ""
    
    @staticmethod
    def parse_report_data(text: str, filename: str) -> Dict[str, Any]:
        """Parse structured data from report text"""
        logger.info(f"Parsing report data for {filename}")
        logger.info(f"Text to parse: {text[:1000]}...")  # Log first 1000 chars
        
        data = {
            'id': filename.replace('.pdf', ''),
            'filename': filename,
            'timestamp': datetime.now().isoformat(),
            'observer_name': 'Not found',
            'species': 'Not found',
            'city': 'Not found',
            'location': 'Not found',
            'date': 'Not found',
            'time': 'Not found',
            'urgency_level': 'Medium',
            'weather': 'Not found',
            'animal_behavior': 'Not found',
            'description': 'Not found'
        }
        
        # Extract data using simple text parsing
        lines = text.split('\n')
        found_fields = []
        
        for line in lines:
            line = line.strip()
            if 'Observer Name:' in line or 'observer name:' in line.lower():
                data['observer_name'] = line.split(':')[-1].strip()
                found_fields.append('observer_name')
            elif 'Date:' in line and not data['date']:
                data['date'] = line.split('Date:')[-1].strip()
                found_fields.append('date')
            elif 'Time:' in line:
                data['time'] = line.split('Time:')[-1].strip()
                found_fields.append('time')
            elif 'Wildlife Species:' in line or 'species:' in line.lower():
                data['species'] = line.split(':')[-1].strip()
                found_fields.append('species')
            elif 'City:' in line:
                data['city'] = line.split('City:')[-1].strip()
                found_fields.append('city')
            elif 'Specific Location:' in line or 'location:' in line.lower():
                data['location'] = line.split(':')[-1].strip()
                found_fields.append('location')
            elif 'Weather Conditions:' in line or 'weather:' in line.lower():
                data['weather'] = line.split(':')[-1].strip()
                found_fields.append('weather')
            elif 'Animal Behavior:' in line or 'behavior:' in line.lower():
                data['animal_behavior'] = line.split(':')[-1].strip()
                found_fields.append('animal_behavior')
            elif 'Urgency Level:' in line or 'urgency:' in line.lower():
                data['urgency_level'] = line.split(':')[-1].strip()
                found_fields.append('urgency_level')
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
                    found_fields.append('description')
        
        # If no structured data found, extract any text as description
        if not found_fields and text.strip():
            data['description'] = text.strip()[:500] + ('...' if len(text) > 500 else '')
            data['observer_name'] = 'Auto-extracted'
            data['species'] = 'Unknown species'
            
        logger.info(f"Found fields: {found_fields}")
        logger.info(f"Parsed data: {data}")
        
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
        logger.info("Using watchdog-based monitoring for real-time PDF processing")
        return None
    
    def process_pdf_file(self, file_path: Path) -> Dict[str, Any]:
        """Process a single PDF file"""
        try:
            # Don't skip already processed files - allow reprocessing
            logger.info(f"Processing: {file_path.name}")
            
            # Extract text from PDF
            text = self.parser.extract_text_from_pdf(str(file_path))
            
            logger.info(f"Extracted text length: {len(text)} characters")
            if text:
                logger.info(f"Text preview: {text[:200]}...")
            
            if not text:
                logger.warning(f"No text extracted from {file_path.name}")
                # Still create a basic report even if no text is extracted
                data = {
                    'id': file_path.name.replace('.pdf', ''),
                    'filename': file_path.name,
                    'timestamp': datetime.now().isoformat(),
                    'observer_name': 'Unknown',
                    'species': 'Unknown',
                    'city': 'Unknown',
                    'location': 'Unknown',
                    'date': datetime.now().strftime('%Y-%m-%d'),
                    'time': datetime.now().strftime('%H:%M'),
                    'urgency_level': 'Medium',
                    'weather': 'Unknown',
                    'animal_behavior': 'Unknown',
                    'description': f'PDF file {file_path.name} could not be parsed. Manual review required.',
                    'file_path': str(file_path),
                    'file_size': file_path.stat().st_size,
                    'last_modified': datetime.fromtimestamp(file_path.stat().st_mtime).isoformat(),
                    'status': 'parsing_failed'
                }
                self.processed_files.add(file_path.name)
                return data
            
            # Parse structured data
            data = self.parser.parse_report_data(text, file_path.name)
            data['file_path'] = str(file_path)
            data['file_size'] = file_path.stat().st_size
            data['last_modified'] = datetime.fromtimestamp(
                file_path.stat().st_mtime
            ).isoformat()
            data['status'] = 'processed'
            data['raw_text_preview'] = text[:500]  # Add preview for debugging
            
            self.processed_files.add(file_path.name)
            logger.info(f"Successfully processed: {file_path.name}")
            logger.info(f"Extracted data: {data}")
            
            return data
            
        except Exception as e:
            logger.error(f"Error processing {file_path}: {e}")
            # Create error report
            error_data = {
                'id': file_path.name.replace('.pdf', '') if file_path else 'unknown',
                'filename': file_path.name if file_path else 'unknown',
                'timestamp': datetime.now().isoformat(),
                'observer_name': 'Error',
                'species': 'Error',
                'city': 'Error',
                'location': 'Error',
                'date': datetime.now().strftime('%Y-%m-%d'),
                'time': datetime.now().strftime('%H:%M'),
                'urgency_level': 'High',
                'weather': 'Error',
                'animal_behavior': 'Error',
                'description': f'Error processing PDF: {str(e)}',
                'file_path': str(file_path) if file_path else 'unknown',
                'file_size': 0,
                'last_modified': datetime.now().isoformat(),
                'status': 'error'
            }
            return error_data
    
    def scan_existing_files(self) -> List[Dict[str, Any]]:
        """Scan existing PDF files in the reports folder"""
        reports = []
        
        # Clear processed files to allow reprocessing
        self.processed_files.clear()
        logger.info("Cleared processed files cache for fresh scan")
        
        if not self.reports_folder.exists():
            logger.warning(f"Reports folder does not exist: {self.reports_folder}")
            return reports
        
        pdf_files = list(self.reports_folder.glob("*.pdf"))
        logger.info(f"Found {len(pdf_files)} PDF files to process")
        
        for pdf_file in pdf_files:
            logger.info(f"Processing file: {pdf_file.name}")
            data = self.process_pdf_file(pdf_file)
            if data:
                reports.append(data)
                logger.info(f"Added report for {pdf_file.name}")
            else:
                logger.warning(f"No data returned for {pdf_file.name}")
        
        logger.info(f"Total reports collected: {len(reports)}")
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
        logger.info(f"Monitoring folder: {self.reports_folder}")
        logger.info(f"Output file: {self.output_path}")
        
        # Initial scan
        logger.info("Performing initial scan...")
        reports = self.scan_existing_files()
        self.save_monitoring_data(reports)
        
        while True:
            try:
                # Scan for new/updated files
                reports = self.scan_existing_files()
                
                # Save current data
                self.save_monitoring_data(reports)
                
                if len(reports) > 0:
                    logger.info(f"Found and processed {len(reports)} reports")
                
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
    
    logger.info("Using watchdog-based real-time monitoring")
    
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