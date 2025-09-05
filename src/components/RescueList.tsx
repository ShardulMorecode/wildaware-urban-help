import { Phone, MessageCircle, Clock, MapPin } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { rescueOrgs, RescueOrg } from '@/data/wildlife-data';
import { ClassificationResult } from '@/utils/wildlife-classifier';
import { useActivityLogger } from '@/hooks/useActivityLogger';

interface RescueListProps {
  classification?: ClassificationResult;
  userCity?: string;
}

const RescueList = ({ classification, userCity }: RescueListProps) => {
  const { logActivity } = useActivityLogger();
  
  const filterRescueOrgs = (): RescueOrg[] => {
    let filtered = rescueOrgs;

    // Filter by city if provided
    if (userCity) {
      filtered = filtered.filter(org => 
        org.city.toLowerCase().includes(userCity.toLowerCase()) ||
        org.city === 'Statewide'
      );
    }

    // Filter by species if classification is available
    if (classification && classification.speciesGuess !== 'unknown') {
      filtered = filtered.filter(org =>
        org.speciesSupported.includes(classification.speciesGuess) ||
        org.speciesSupported.includes('wildlife')
      );
    }

    // Sort by relevance: 24x7 first, then city match, then statewide
    return filtered.sort((a, b) => {
      if (a.hours.includes('24') && !b.hours.includes('24')) return -1;
      if (!a.hours.includes('24') && b.hours.includes('24')) return 1;
      if (userCity) {
        const aMatchesCity = a.city.toLowerCase().includes(userCity.toLowerCase());
        const bMatchesCity = b.city.toLowerCase().includes(userCity.toLowerCase());
        if (aMatchesCity && !bMatchesCity) return -1;
        if (!aMatchesCity && bMatchesCity) return 1;
      }
      return 0;
    });
  };

  const filteredOrgs = filterRescueOrgs().slice(0, 3); // Show top 3

  const handleCall = (phone: string, orgName?: string) => {
    // Log the activity
    logActivity({
      activity_type: 'call_helpline',
      species: classification?.speciesGuess,
      ngo_name: orgName,
      ngo_phone: phone,
      notes: `Called ${orgName || 'rescue organization'} for ${classification?.speciesGuess || 'wildlife'} assistance`,
      metadata: {
        urgency: classification?.urgency,
        userCity: userCity
      }
    });
    
    window.location.href = `tel:${phone}`;
  };

  const handleWhatsApp = (whatsapp: string, orgName?: string) => {
    const message = classification 
      ? `Hi, I need help with a ${classification.speciesGuess} encounter. ${classification.urgency} urgency.`
      : 'Hi, I need help with a wildlife encounter.';
    
    // Log the activity
    logActivity({
      activity_type: 'call_helpline',
      species: classification?.speciesGuess,
      ngo_name: orgName,
      ngo_phone: whatsapp,
      notes: `Contacted ${orgName || 'rescue organization'} via WhatsApp for ${classification?.speciesGuess || 'wildlife'} assistance`,
      metadata: {
        urgency: classification?.urgency,
        userCity: userCity,
        contactMethod: 'whatsapp'
      }
    });
    
    window.open(`https://wa.me/${whatsapp}?text=${encodeURIComponent(message)}`, '_blank');
  };

  const getUrgencyMessage = () => {
    if (!classification) return '';
    
    if (classification.urgency === 'high') {
      return '🚨 HIGH URGENCY - Call immediately!';
    } else if (classification.urgency === 'medium') {
      return '⚠️ Moderate urgency - Contact soon';
    }
    return 'ℹ️ For guidance and assistance';
  };

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Phone className="w-5 h-5 text-primary" />
          Nearby Help
        </CardTitle>
        {classification && (
          <p className="text-sm text-muted-foreground">
            {getUrgencyMessage()}
          </p>
        )}
      </CardHeader>

      <CardContent className="space-y-4">
        {filteredOrgs.length === 0 ? (
          <div className="text-center py-6">
            <Phone className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
            <p className="text-sm text-muted-foreground mb-4">
              No local rescuers found. Try the state helpline or nearest district.
            </p>
            <Button 
              variant="outline" 
              onClick={() => handleCall('1800-425-4733', 'Kerala State Helpline')}
              className="w-full"
            >
              <Phone className="w-4 h-4 mr-2" />
              Call State Helpline
            </Button>
          </div>
        ) : (
          filteredOrgs.map((org) => (
            <Card key={org.id} className="p-4 hover:shadow-card transition-smooth">
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-semibold text-sm">{org.name}</h4>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                      <MapPin className="w-3 h-3" />
                      {org.city}
                    </div>
                  </div>
                  {org.hours.includes('24') && (
                    <Badge variant="secondary" className="text-xs">
                      24/7
                    </Badge>
                  )}
                </div>

                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="w-3 h-3" />
                  {org.hours}
                </div>

                <div className="flex flex-wrap gap-1">
                  {org.speciesSupported.map((species) => (
                    <Badge 
                      key={species} 
                      variant="outline" 
                      className={`text-xs ${
                        classification?.speciesGuess === species ? 'bg-primary text-primary-foreground' : ''
                      }`}
                    >
                      {species}
                    </Badge>
                  ))}
                </div>

                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant={classification?.urgency === 'high' ? 'emergency' : 'rescue'}
                    onClick={() => handleCall(org.phone, org.name)}
                    className="flex-1"
                  >
                    <Phone className="w-4 h-4 mr-2" />
                    Call
                  </Button>
                  
                  {org.whatsapp && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleWhatsApp(org.whatsapp!, org.name)}
                      className="flex-1"
                    >
                      <MessageCircle className="w-4 h-4 mr-2" />
                      WhatsApp
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          ))
        )}

        {userCity && filteredOrgs.length > 0 && (
          <p className="text-xs text-muted-foreground text-center">
            Showing rescuers for {userCity}. Change city in header for different areas.
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export default RescueList;