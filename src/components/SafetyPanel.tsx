import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, Heart, AlertTriangle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useState, useEffect } from 'react';
interface ClassificationResult {
  speciesGuess: string;
  urgency: 'low' | 'medium' | 'high';
  intent: 'guidance' | 'call_help' | 'report_sighting';
  confidence: number;
  reasoning: string;
}

interface SafetyGuideline {
  id: string;
  species_common_name: string;
  dos: string[] | string;
  donts: string[] | string;
  first_aid: string;
  authority_notes: string;
  source_url: string;
  species_id?: string;
  authority_to_contact?: string;
  created_at?: string;
  updated_at?: string;
  situation?: string;
}

interface Species {
  id: string;
  common_name: string;
  scientific_name: string;
  risk_level: string;
  keywords: string[];
  image_ref: string;
  source_url: string;
}

interface SafetyPanelProps {
  classification?: ClassificationResult;
}

const SafetyPanel = ({ classification }: SafetyPanelProps) => {
  const [safetyGuidelines, setSafetyGuidelines] = useState<SafetyGuideline | null>(null);
  const [speciesData, setSpeciesData] = useState<Species | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Reset state when classification changes
    setSafetyGuidelines(null);
    setSpeciesData(null);
    
    if (!classification || classification.speciesGuess === 'unknown') {
      return;
    }

    const fetchGuidelines = async () => {
      setLoading(true);
      try {
        console.log('Fetching data for species:', classification.speciesGuess);
        
        // Try to find species by common name or scientific name
        const { data: speciesResults, error: speciesError } = await supabase
          .from('species')
          .select('*')
          .or(`common_name.ilike.%${classification.speciesGuess}%,scientific_name.ilike.%${classification.speciesGuess}%`);

        console.log('Species results:', speciesResults, 'Error:', speciesError);

        if (speciesError) {
          console.error('Error fetching species:', speciesError);
          return;
        }

        let matchedSpecies = null;
        if (speciesResults && speciesResults.length > 0) {
          // Find exact match first, then fallback to partial match
          matchedSpecies = speciesResults.find(s => 
            s.common_name.toLowerCase() === classification.speciesGuess.toLowerCase() ||
            s.scientific_name.toLowerCase() === classification.speciesGuess.toLowerCase()
          ) || speciesResults[0];
          
          setSpeciesData(matchedSpecies);
          
          // Fetch safety guidelines using the matched species common name
          const { data: guidelinesResult, error: guidelinesError } = await supabase
            .from('safety_guidelines')
            .select('*')
            .eq('species_common_name', matchedSpecies.common_name)
            .maybeSingle();

          console.log('Guidelines result:', guidelinesResult, 'Error:', guidelinesError);

          if (guidelinesError) {
            console.error('Error fetching guidelines:', guidelinesError);
            return;
          }

          if (guidelinesResult) {
            setSafetyGuidelines(guidelinesResult as SafetyGuideline);
          }
        }
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchGuidelines();
  }, [classification]);

  if (!classification || classification.speciesGuess === 'unknown') {
    return (
      <Card className="h-full">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <AlertTriangle className="w-4 h-4 text-primary" />
            Safety Guidelines
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-full">
          <p className="text-sm text-muted-foreground text-center">
            Describe your wildlife encounter to get specific safety guidelines
          </p>
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card className="h-full">
        <CardContent className="p-6 flex items-center justify-center">
          <div className="text-center">
            <div className="w-8 h-8 mx-auto mb-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
            <p className="text-sm text-muted-foreground">Loading safety guidelines...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!speciesData || !safetyGuidelines) {
    return (
      <Card className="h-full">
        <CardContent className="p-6">
          <p className="text-center text-muted-foreground">
            Safety guidelines not available for this species.
          </p>
        </CardContent>
      </Card>
    );
  }

  const getUrgencyStyles = (urgency: string) => {
    switch (urgency) {
      case 'high':
        return {
          border: 'border-destructive',
          badge: 'bg-destructive text-destructive-foreground',
          icon: 'text-destructive'
        };
      case 'medium':
        return {
          border: 'border-warning',
          badge: 'bg-warning text-warning-foreground',
          icon: 'text-warning'
        };
      default:
        return {
          border: 'border-success',
          badge: 'bg-success text-success-foreground',
          icon: 'text-success'
        };
    }
  };

  const styles = getUrgencyStyles(classification.urgency);

  return (
    <Card className={`h-full flex flex-col ${styles.border} border-2`}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className={`w-5 h-5 ${styles.icon}`} />
            {speciesData.common_name} Safety
          </CardTitle>
          <Badge className={styles.badge}>
            {classification.urgency} urgency
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          Risk Level: {speciesData.risk_level} • {speciesData.scientific_name}
        </p>
      </CardHeader>

      <CardContent className="space-y-4 flex-1 overflow-y-auto">
        {/* Immediate DO's */}
        <div className="space-y-2">
          <h4 className="font-semibold text-success flex items-center gap-2 text-sm">
            <CheckCircle className="w-4 h-4" />
            Immediate DO's
          </h4>
          <div className="text-xs bg-success/10 p-2 rounded-lg">
            {Array.isArray(safetyGuidelines.dos) ? safetyGuidelines.dos.join('. ') : safetyGuidelines.dos}
          </div>
        </div>

        {/* DON'Ts */}
        <div className="space-y-2">
          <h4 className="font-semibold text-destructive flex items-center gap-2 text-sm">
            <XCircle className="w-4 h-4" />
            DON'T Do These
          </h4>
          <div className="text-xs bg-destructive/10 p-2 rounded-lg">
            {Array.isArray(safetyGuidelines.donts) ? safetyGuidelines.donts.join('. ') : safetyGuidelines.donts}
          </div>
        </div>

        {/* First Aid */}
        <div className="space-y-2">
          <h4 className="font-semibold text-info flex items-center gap-2 text-sm">
            <Heart className="w-4 h-4" />
            First Aid
          </h4>
          <div className="text-xs bg-info/10 p-2 rounded-lg">
            {safetyGuidelines.first_aid}
          </div>
        </div>

        {/* Authority Notes */}
        {safetyGuidelines.authority_notes && (
          <div className="space-y-2">
            <h4 className="font-semibold text-muted-foreground text-xs uppercase tracking-wide">
              Important Notes
            </h4>
            <p className="text-xs text-muted-foreground bg-muted p-2 rounded-lg">
              {safetyGuidelines.authority_notes}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SafetyPanel;