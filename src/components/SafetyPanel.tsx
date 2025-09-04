import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, Heart, AlertTriangle } from 'lucide-react';
import { SafetyGuideline, Species, safetyGuidelines, species } from '@/data/wildlife-data';
import { ClassificationResult } from '@/utils/wildlife-classifier';

interface SafetyPanelProps {
  classification?: ClassificationResult;
}

const SafetyPanel = ({ classification }: SafetyPanelProps) => {
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

  const speciesData = species.find(s => s.commonName.toLowerCase() === classification.speciesGuess);
  const guidelines = safetyGuidelines.find(g => g.speciesId === speciesData?.id);

  if (!speciesData || !guidelines) {
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
            {speciesData.commonName} Safety
          </CardTitle>
          <Badge className={styles.badge}>
            {classification.urgency} urgency
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          Risk Level: {speciesData.riskLevel} • {speciesData.description}
        </p>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Immediate DO's */}
        <div className="space-y-3">
          <h4 className="font-semibold text-success flex items-center gap-2">
            <CheckCircle className="w-4 h-4" />
            Immediate DO's
          </h4>
          <ul className="space-y-2">
            {guidelines.dos.map((item, index) => (
              <li key={index} className="flex items-start gap-2 text-sm">
                <CheckCircle className="w-4 h-4 text-success mt-0.5 flex-shrink-0" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* DON'Ts */}
        <div className="space-y-3">
          <h4 className="font-semibold text-destructive flex items-center gap-2">
            <XCircle className="w-4 h-4" />
            DON'T Do These
          </h4>
          <ul className="space-y-2">
            {guidelines.donts.map((item, index) => (
              <li key={index} className="flex items-start gap-2 text-sm">
                <XCircle className="w-4 h-4 text-destructive mt-0.5 flex-shrink-0" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* First Aid */}
        <div className="space-y-3">
          <h4 className="font-semibold text-info flex items-center gap-2">
            <Heart className="w-4 h-4" />
            First Aid
          </h4>
          <p className="text-sm bg-accent-soft p-3 rounded-xl">
            {guidelines.firstAid}
          </p>
        </div>

        {/* Authority Notes */}
        {guidelines.authorityNotes && (
          <div className="space-y-3">
            <h4 className="font-semibold text-muted-foreground text-xs uppercase tracking-wide">
              Important Notes
            </h4>
            <p className="text-sm text-muted-foreground bg-muted p-3 rounded-xl">
              {guidelines.authorityNotes}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SafetyPanel;