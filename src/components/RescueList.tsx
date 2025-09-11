import { Phone, MessageCircle, Clock, MapPin } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useState, useEffect } from 'react';
interface ClassificationResult {
  speciesGuess: string;
  urgency: 'low' | 'medium' | 'high';
  intent: 'guidance' | 'call_help' | 'report_sighting';
  confidence: number;
  reasoning: string;
}

interface RescueOrg {
  id: string;
  name: string;
  state: string;
  district: string;
  phone: string;
  whatsapp: string;
  species_supported: string[];
  email: string;
  type: string;
  source_url: string;
}

import { useActivityLogger } from '@/hooks/useActivityLogger';

interface RescueListProps {
  classification?: ClassificationResult;
  userCity?: string;
}

const RescueList = ({ classification, userCity }: RescueListProps) => {
  const { logActivity } = useActivityLogger();
  const [rescueOrgs, setRescueOrgs] = useState<RescueOrg[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRescueOrgs = async () => {
      setLoading(true);
      try {
        console.log('Fetching rescue orgs...');
        const { data, error } = await supabase
          .from('rescue_orgs')
          .select('*');
        
        console.log('Rescue orgs data:', data, 'Error:', error);
        
        if (error) {
          console.error('Error fetching rescue orgs:', error);
        } else {
          setRescueOrgs(data || []);
        }
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchRescueOrgs();
  }, []);

  const filterRescueOrgs = (): RescueOrg[] => {
    console.log('Filtering orgs. UserCity:', userCity, 'Total orgs:', rescueOrgs.length);
    let filtered = rescueOrgs;

    // Filter by state/district if userCity provided  
    if (userCity && userCity.trim()) {
      const cityLower = userCity.toLowerCase().trim();
      console.log('Filtering by city:', cityLower);
      
      filtered = filtered.filter(org => {
        const stateMatch = org.state?.toLowerCase().includes(cityLower);
        const districtMatch = org.district?.toLowerCase().includes(cityLower);
        const nameMatch = org.name?.toLowerCase().includes(cityLower);
        
        console.log(`Org: ${org.name}, State: ${org.state}, District: ${org.district}`, 
                   'Matches:', { stateMatch, districtMatch, nameMatch });
        
        return stateMatch || districtMatch || nameMatch;
      });
      
      console.log('After city filter:', filtered.length);
    }

    // Sort by relevance: type (Government first), then by district match
    return filtered.sort((a, b) => {
      if (a.type === 'Government Helpline' && b.type !== 'Government Helpline') return -1;
      if (a.type !== 'Government Helpline' && b.type === 'Government Helpline') return 1;
      if (userCity) {
        const aMatchesDistrict = a.district?.toLowerCase().includes(userCity.toLowerCase());
        const bMatchesDistrict = b.district?.toLowerCase().includes(userCity.toLowerCase());
        if (aMatchesDistrict && !bMatchesDistrict) return -1;
        if (!aMatchesDistrict && bMatchesDistrict) return 1;
      }
      return 0;
    });
  };

  const filteredOrgs = filterRescueOrgs().slice(0, 3); // Show top 3
  
  console.log('Final filtered orgs:', filteredOrgs.length, filteredOrgs.map(o => ({name: o.name, city: userCity})));

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

      <CardContent className="space-y-4 overflow-hidden h-full flex flex-col">
        {loading ? (
          <div className="text-center py-6">
            <div className="w-8 h-8 mx-auto mb-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
            <p className="text-sm text-muted-foreground">Loading rescue organizations...</p>
          </div>
        ) : !userCity || userCity.trim() === '' ? (
          <div className="text-center py-6">
            <Phone className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
            <p className="text-sm text-muted-foreground">
              Enter your city in the header to see local rescue contacts.
            </p>
          </div>
        ) : filteredOrgs.length === 0 ? (
          <div className="text-center py-6">
            <Phone className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
            <p className="text-sm text-muted-foreground mb-4">
              No local rescuers found for {userCity || 'your area'}. Try the state helpline.
            </p>
            <Button 
              variant="outline" 
              onClick={() => handleCall('1800-425-4733', 'State Helpline')}
              className="w-full"
            >
              <Phone className="w-4 h-4 mr-2" />
              Call State Helpline
            </Button>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto space-y-3 scrollbar-thin scrollbar-thumb-border scrollbar-track-background">
            {filteredOrgs.map((org) => (
            <Card key={org.id} className="p-4 hover:shadow-card transition-smooth">
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-semibold text-sm">{org.name}</h4>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                      <MapPin className="w-3 h-3" />
                      {org.district}, {org.state}
                    </div>
                  </div>
                  {org.type === 'Government Helpline' && (
                    <Badge variant="secondary" className="text-xs">
                      Official
                    </Badge>
                  )}
                </div>

                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="w-3 h-3" />
                  {org.type}
                </div>

                <div className="flex flex-wrap gap-1">
                  {org.species_supported?.map((species) => (
                    <Badge 
                      key={species} 
                      variant="outline" 
                      className={`text-xs ${
                        classification?.speciesGuess.toLowerCase().includes(species.toLowerCase()) ? 'bg-primary text-primary-foreground' : ''
                      }`}
                    >
                      {species}
                    </Badge>
                  ))}
                </div>

                <div className="space-y-2">
                  {/* Contact Information */}
                  <div className="text-xs space-y-1">
                    {org.phone && (
                      <div className="flex items-center gap-1">
                        <Phone className="w-3 h-3" />
                        <span>{org.phone}</span>
                      </div>
                    )}
                    {org.whatsapp && (
                      <div className="flex items-center gap-1">
                        <MessageCircle className="w-3 h-3" />
                        <span>{org.whatsapp}</span>
                      </div>
                    )}
                    {org.email && (
                      <div className="flex items-center gap-1">
                        <span className="text-xs">📧</span>
                        <span>{org.email}</span>
                      </div>
                    )}
                  </div>
                  
                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    {org.phone ? (
                      <Button
                        size="sm"
                        variant={classification?.urgency === 'high' ? 'default' : 'default'}
                        onClick={() => handleCall(org.phone, org.name)}
                        className="flex-1"
                      >
                        <Phone className="w-4 h-4 mr-2" />
                        Call
                      </Button>
                    ) : (
                      <div className="flex-1 text-xs text-muted-foreground text-center py-2">
                        Phone unavailable
                      </div>
                    )}
                    
                    {org.whatsapp ? (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleWhatsApp(org.whatsapp!, org.name)}
                        className="flex-1"
                      >
                        <MessageCircle className="w-4 h-4 mr-2" />
                        WhatsApp
                      </Button>
                    ) : (
                      <div className="flex-1 text-xs text-muted-foreground text-center py-2">
                        WhatsApp unavailable
                      </div>
                    )}
                  </div>
                </div>
              </div>
              </Card>
            ))}
          </div>
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