# PowerShell script for setting up Pathway wildlife monitoring on Windows
# Run as Administrator: PowerShell -ExecutionPolicy Bypass -File setup-windows.ps1

Write-Host "Wildlife Monitoring Setup for Windows" -ForegroundColor Green
Write-Host "=====================================" -ForegroundColor Green

# Check if Python is installed
try {
    $pythonVersion = python --version 2>$null
    Write-Host "Found Python: $pythonVersion" -ForegroundColor Green
} catch {
    Write-Host "Python not found. Please install Python 3.8+ from https://python.org" -ForegroundColor Red
    exit 1
}

# Create reports folder
$reportsFolder = "C:\WildlifeReports"
if (!(Test-Path $reportsFolder)) {
    New-Item -ItemType Directory -Path $reportsFolder -Force
    Write-Host "Created reports folder: $reportsFolder" -ForegroundColor Green
} else {
    Write-Host "Reports folder already exists: $reportsFolder" -ForegroundColor Yellow
}

# Set folder permissions (allow read/write for current user)
try {
    $acl = Get-Acl $reportsFolder
    $accessRule = New-Object System.Security.AccessControl.FileSystemAccessRule(
        $env:USERNAME, "FullControl", "Allow"
    )
    $acl.SetAccessRule($accessRule)
    Set-Acl $reportsFolder $acl
    Write-Host "Set folder permissions for $env:USERNAME" -ForegroundColor Green
} catch {
    Write-Host "Warning: Could not set folder permissions" -ForegroundColor Yellow
}

# Install Python packages
Write-Host "Installing Python packages..." -ForegroundColor Blue
try {
    python -m pip install --upgrade pip
    python -m pip install -r requirements-pathway.txt
    Write-Host "Python packages installed successfully" -ForegroundColor Green
} catch {
    Write-Host "Error installing Python packages" -ForegroundColor Red
    exit 1
}

# Create Windows service script
$serviceScript = @"
# Windows Service wrapper for Pathway monitoring
import win32serviceutil
import win32service
import win32event
import servicemanager
import sys
import os

# Add current directory to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from pathway_monitor import main

class WildlifeMonitorService(win32serviceutil.ServiceFramework):
    _svc_name_ = "WildlifeMonitor"
    _svc_display_name_ = "Wildlife Report Monitor"
    _svc_description_ = "Monitors wildlife reports using Pathway framework"
    
    def __init__(self, args):
        win32serviceutil.ServiceFramework.__init__(self, args)
        self.hWaitStop = win32event.CreateEvent(None, 0, 0, None)
    
    def SvcStop(self):
        self.ReportServiceStatus(win32service.SERVICE_STOP_PENDING)
        win32event.SetEvent(self.hWaitStop)
    
    def SvcDoRun(self):
        servicemanager.LogMsg(
            servicemanager.EVENTLOG_INFORMATION_TYPE,
            servicemanager.PYS_SERVICE_STARTED,
            (self._svc_name_, '')
        )
        
        try:
            main()
        except Exception as e:
            servicemanager.LogErrorMsg(f"Service error: {e}")

if __name__ == '__main__':
    win32serviceutil.HandleCommandLine(WildlifeMonitorService)
"@

$serviceScript | Out-File -FilePath "wildlife_service.py" -Encoding UTF8
Write-Host "Created Windows service script: wildlife_service.py" -ForegroundColor Green

# Create batch file for easy starting
$batchScript = @"
@echo off
echo Starting Wildlife Monitor...
cd /d "%~dp0"
python pathway_monitor.py
pause
"@

$batchScript | Out-File -FilePath "start_monitor.bat" -Encoding ASCII
Write-Host "Created start script: start_monitor.bat" -ForegroundColor Green

# Create scheduled task
Write-Host "Creating scheduled task..." -ForegroundColor Blue
try {
    $taskName = "WildlifeMonitor"
    $taskExists = Get-ScheduledTask -TaskName $taskName -ErrorAction SilentlyContinue
    
    if ($taskExists) {
        Unregister-ScheduledTask -TaskName $taskName -Confirm:$false
    }
    
    $action = New-ScheduledTaskAction -Execute "python" -Argument "pathway_monitor.py" -WorkingDirectory $PWD
    $trigger = New-ScheduledTaskTrigger -AtStartup
    $settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable
    $principal = New-ScheduledTaskPrincipal -UserId $env:USERNAME -LogonType Interactive
    
    Register-ScheduledTask -TaskName $taskName -Action $action -Trigger $trigger -Settings $settings -Principal $principal
    Write-Host "Created scheduled task: $taskName" -ForegroundColor Green
} catch {
    Write-Host "Warning: Could not create scheduled task" -ForegroundColor Yellow
}

# Create PowerShell monitoring functions
$monitoringScript = @"
# PowerShell functions for monitoring wildlife reports

function Get-WildlifeReports {
    param([string]`$Path = "C:\WildlifeReports")
    Get-ChildItem -Path `$Path -Filter "*.pdf" | ForEach-Object {
        [PSCustomObject]@{
            Name = `$_.Name
            Size = `$_.Length
            Created = `$_.CreationTime
            Modified = `$_.LastWriteTime
        }
    }
}

function Watch-ReportsFolder {
    param([string]`$Path = "C:\WildlifeReports")
    `$watcher = New-Object System.IO.FileSystemWatcher
    `$watcher.Path = `$Path
    `$watcher.Filter = "*.pdf"
    `$watcher.EnableRaisingEvents = `$true
    
    Register-ObjectEvent -InputObject `$watcher -EventName Created -Action {
        Write-Host "New report detected: `$(`$Event.SourceEventArgs.FullPath)" -ForegroundColor Green
    }
    
    Write-Host "Watching for new reports in: `$Path" -ForegroundColor Blue
    Write-Host "Press Ctrl+C to stop monitoring" -ForegroundColor Yellow
    
    try {
        while (`$true) { Start-Sleep 1 }
    } finally {
        `$watcher.EnableRaisingEvents = `$false
        `$watcher.Dispose()
    }
}

function Start-WildlifeMonitor {
    Write-Host "Starting Wildlife Monitor..." -ForegroundColor Green
    Start-Process -FilePath "python" -ArgumentList "pathway_monitor.py" -NoNewWindow
}

# Export functions
Export-ModuleMember -Function Get-WildlifeReports, Watch-ReportsFolder, Start-WildlifeMonitor
"@

$monitoringScript | Out-File -FilePath "WildlifeMonitoring.psm1" -Encoding UTF8
Write-Host "Created PowerShell module: WildlifeMonitoring.psm1" -ForegroundColor Green

Write-Host "`nSetup completed successfully!" -ForegroundColor Green
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Run 'python pathway_monitor.py' to start monitoring" -ForegroundColor White
Write-Host "2. Or double-click 'start_monitor.bat' for easy startup" -ForegroundColor White
Write-Host "3. Place PDF reports in: $reportsFolder" -ForegroundColor White
Write-Host "4. Monitor output in: $reportsFolder\monitoring_data.json" -ForegroundColor White

Write-Host "`nFor PowerShell integration:" -ForegroundColor Yellow
Write-Host "Import-Module .\WildlifeMonitoring.psm1" -ForegroundColor White
Write-Host "Get-WildlifeReports" -ForegroundColor White