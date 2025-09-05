import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Phone, MessageCircle, Eye, Calendar, MapPin } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useActivityLogger } from "@/hooks/useActivityLogger";

interface Activity {
  id: string;
  activity_type: string;
  species?: string | null;
  ngo_name?: string | null;
  ngo_phone?: string | null;
  notes?: string | null;
  metadata?: any;
  occurred_at: string;
  created_at: string;
}

export default function Activity() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { getActivities } = useActivityLogger();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }

    loadActivities();
  }, [user, navigate]);

  const loadActivities = async () => {
    try {
      const data = await getActivities();
      setActivities(data);
    } catch (error) {
      console.error('Failed to load activities:', error);
    } finally {
      setLoading(false);
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'call_helpline':
        return <Phone className="h-4 w-4" />;
      case 'report_sighting':
        return <Eye className="h-4 w-4" />;
      case 'guidance':
        return <MessageCircle className="h-4 w-4" />;
      default:
        return <Calendar className="h-4 w-4" />;
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'call_helpline':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'report_sighting':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'guidance':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const formatActivityType = (type: string) => {
    switch (type) {
      case 'call_helpline':
        return 'Called Helpline';
      case 'report_sighting':
        return 'Reported Sighting';
      case 'guidance':
        return 'Sought Guidance';
      default:
        return type;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container max-w-4xl mx-auto py-8">
          <div className="text-center">Loading your activities...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container max-w-4xl mx-auto py-8 px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Your Wildlife Activities</h1>
          <p className="text-muted-foreground">
            Track your interactions with rescue organizations and wildlife encounters
          </p>
        </div>

        {activities.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <Calendar className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">No activities yet</h3>
              <p className="text-muted-foreground mb-4">
                Your wildlife safety activities will appear here once you start using WildAware.
              </p>
              <Button onClick={() => navigate('/')}>
                Start Using WildAware
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {activities.map((activity) => (
              <Card key={activity.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-full ${getActivityColor(activity.activity_type)}`}>
                        {getActivityIcon(activity.activity_type)}
                      </div>
                      <div>
                        <CardTitle className="text-lg">
                          {formatActivityType(activity.activity_type)}
                        </CardTitle>
                        <CardDescription>
                          {formatDate(activity.occurred_at)}
                        </CardDescription>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2 text-right">
                      {activity.species && (
                        <Badge variant="outline" className="text-xs">
                          {activity.species}
                        </Badge>
                      )}
                      {activity.metadata?.urgency && (
                        <Badge 
                          variant={activity.metadata.urgency === 'high' ? 'destructive' : 'secondary'}
                          className="text-xs"
                        >
                          {activity.metadata.urgency} urgency
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="pt-0">
                  <div className="space-y-2">
                    {activity.ngo_name && (
                      <div className="flex items-center gap-2 text-sm">
                        <Phone className="h-3 w-3 text-muted-foreground" />
                        <span className="font-medium">{activity.ngo_name}</span>
                        {activity.ngo_phone && (
                          <span className="text-muted-foreground">({activity.ngo_phone})</span>
                        )}
                      </div>
                    )}
                    
                    {activity.metadata?.userCity && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <MapPin className="h-3 w-3" />
                        <span>{activity.metadata.userCity}</span>
                      </div>
                    )}
                    
                    {activity.notes && (
                      <p className="text-sm text-muted-foreground bg-muted p-3 rounded-lg">
                        {activity.notes}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}