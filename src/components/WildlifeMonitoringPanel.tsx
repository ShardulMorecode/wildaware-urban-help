import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Activity, MapPin, Clock, AlertTriangle } from 'lucide-react';
import { pathwayMonitor } from '@/services/pathwayMonitoring';

interface MonitoringData {
  id: string;
  observerName: string;
  species: string;
  city: string;
  location: string;
  date: string;
  time: string;
  urgencyLevel: string;
  weather: string;
  animalBehavior: string;
  description: string;
  reportFile: string;
}

export const WildlifeMonitoringPanel = () => {
  const [monitoringData, setMonitoringData] = useState<MonitoringData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Initialize Pathway monitoring
    pathwayMonitor.initialize();

    // Subscribe to real-time updates from PDF reports
    const unsubscribe = pathwayMonitor.subscribe((reports) => {
      const formattedData: MonitoringData[] = reports.map(report => ({
        id: report.id,
        observerName: report.content?.observerName || 'Unknown',
        species: report.content?.species || 'Unknown Species',
        city: report.content?.city || 'Unknown City',
        location: report.content?.location || 'Unknown Location',
        date: report.content?.date || '',
        time: report.content?.time || '',
        urgencyLevel: report.content?.urgencyLevel || 'Low',
        weather: report.content?.weather || '',
        animalBehavior: report.content?.animalBehavior || '',
        description: report.content?.description || '',
        reportFile: report.fileName
      }));
      
      setMonitoringData(formattedData);
      setIsLoading(false);
    });

    return unsubscribe;
  }, []);

  const getUrgencyColor = (urgency: string) => {
    switch (urgency.toLowerCase()) {
      case 'high':
      case 'emergency':
        return 'destructive';
      case 'medium':
        return 'default';
      case 'low':
        return 'secondary';
      default:
        return 'secondary';
    }
  };

  const getUrgencyIcon = (urgency: string) => {
    switch (urgency.toLowerCase()) {
      case 'high':
      case 'emergency':
        return <AlertTriangle className="w-3 h-3" />;
      default:
        return <Activity className="w-3 h-3" />;
    }
  };

  if (isLoading) {
    return (
      <Card className="h-[400px]">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Activity className="w-5 h-5 text-primary" />
            Wildlife Monitoring
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-[300px]">
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Loading monitoring data...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-[400px]">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-primary" />
            Wildlife Monitoring
          </div>
          <Badge variant="outline" className="text-xs">
            Live Updates
          </Badge>
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          Real-time data from submitted reports
        </p>
      </CardHeader>
      
      <CardContent className="p-0">
        {monitoringData.length === 0 ? (
          <div className="flex items-center justify-center h-[300px] px-6">
            <div className="text-center">
              <Activity className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
              <h3 className="text-sm font-medium mb-1">No Reports Available</h3>
              <p className="text-xs text-muted-foreground">
                Monitoring data will appear here when PDF reports are available in the reports folder
              </p>
            </div>
          </div>
        ) : (
          <ScrollArea className="h-[300px] px-6">
            <div className="space-y-3">
              {monitoringData.map((report) => (
                <div
                  key={report.id}
                  className="border rounded-lg p-3 hover:bg-muted/30 transition-colors"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Badge 
                        variant={getUrgencyColor(report.urgencyLevel)} 
                        className="text-xs flex items-center gap-1"
                      >
                        {getUrgencyIcon(report.urgencyLevel)}
                        {report.urgencyLevel}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {report.reportFile}
                      </span>
                    </div>
                  </div>
                  
                  <div className="space-y-1">
                    <h4 className="text-sm font-semibold">{report.species}</h4>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {report.city}
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {report.date} {report.time}
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {report.description}
                    </p>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {report.weather && (
                        <Badge variant="outline" className="text-xs">
                          {report.weather}
                        </Badge>
                      )}
                      {report.animalBehavior && (
                        <Badge variant="outline" className="text-xs">
                          {report.animalBehavior}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
};