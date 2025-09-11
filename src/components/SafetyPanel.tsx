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
    if (!classification || classification.speciesGuess === 'unknown') {
      setSafetyGuidelines(null);
      setSpeciesData(null);
      return;
    }

    const fetchGuidelines = async () => {
      setLoading(true);
      try {
        console.log('Fetching data for species:', classification.speciesGuess);
        
        // Fetch species data first
        const { data: speciesResult, error: speciesError } = await supabase
          .from('species')
          .select('*')
          .eq('common_name', classification.speciesGuess)
          .single();

        console.log('Species result:', speciesResult, 'Error:', speciesError);

        if (speciesError && speciesError.code !== 'PGRST116') {
          console.error('Error fetching species:', speciesError);
        }

        if (speciesResult) {
          setSpeciesData(speciesResult);
          
          // Fetch safety guidelines using exact match
          const { data: guidelinesResult, error: guidelinesError } = await supabase
            .from('safety_guidelines')
            .select('*')
            .eq('species_common_name', classification.speciesGuess)
            .single();

          console.log('Guidelines result:', guidelinesResult, 'Error:', guidelinesError);

          if (guidelinesError && guidelinesError.code !== 'PGRST116') {
            console.error('Error fetching guidelines:', guidelinesError);
          }

          if (guidelinesResult) {
            setSafetyGuidelines(guidelinesResult as SafetyGuideline);
          } else {
            // Try alternative search if exact match fails
            const { data: altGuidelines, error: altError } = await supabase
              .from('safety_guidelines')
              .select('*')
              .ilike('species_common_name', `%${classification.speciesGuess}%`)
              .limit(1);
            
            if (altGuidelines && altGuidelines.length > 0) {
              setSafetyGuidelines(altGuidelines[0] as SafetyGuideline);
            }
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
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-accent" />
            Quick Safety Checklist
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center py-8 text-muted-foreground">
            <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
            <p>Describe your wildlife encounter in the chat to get specific safety guidance.</p>
          </div>
          
          <div className="space-y-3">
            <h4 className="font-semibold text-sm">General Wildlife Safety:</h4>
            <div className="space-y-2 text-sm">
              <div className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-success mt-0.5 flex-shrink-0" />
                <span>Keep calm and maintain distance</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-success mt-0.5 flex-shrink-0" />
                <span>Observe from a safe location</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-success mt-0.5 flex-shrink-0" />
                <span>Take photos only from distance</span>
              </div>
              <div className="flex items-start gap-2">
                <XCircle className="w-4 h-4 text-destructive mt-0.5 flex-shrink-0" />
                <span>Never attempt to touch or feed</span>
              </div>
            </div>
          </div>
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
    <Card className={`h-full ${styles.border} border-2`}>
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

      <CardContent className="space-y-6">
        {/* Immediate DO's */}
        <div className="space-y-3">
          <h4 className="font-semibold text-success flex items-center gap-2">
            <CheckCircle className="w-4 h-4" />
            Immediate DO's
          </h4>
          <div className="text-sm bg-success/10 p-3 rounded-xl">
            {Array.isArray(safetyGuidelines.dos) ? safetyGuidelines.dos.join('. ') : safetyGuidelines.dos}
          </div>
        </div>

        {/* DON'Ts */}
        <div className="space-y-3">
          <h4 className="font-semibold text-destructive flex items-center gap-2">
            <XCircle className="w-4 h-4" />
            DON'T Do These
          </h4>
          <div className="text-sm bg-destructive/10 p-3 rounded-xl">
            {Array.isArray(safetyGuidelines.donts) ? safetyGuidelines.donts.join('. ') : safetyGuidelines.donts}
          </div>
        </div>

        {/* First Aid */}
        <div className="space-y-3">
          <h4 className="font-semibold text-info flex items-center gap-2">
            <Heart className="w-4 h-4" />
            First Aid
          </h4>
          <div className="text-sm bg-info/10 p-3 rounded-xl">
            {safetyGuidelines.first_aid}
          </div>
        </div>

        {/* Authority Notes */}
        {safetyGuidelines.authority_notes && (
          <div className="space-y-3">
            <h4 className="font-semibold text-muted-foreground text-xs uppercase tracking-wide">
              Important Notes
            </h4>
            <p className="text-sm text-muted-foreground bg-muted p-3 rounded-xl">
              {safetyGuidelines.authority_notes}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SafetyPanel;