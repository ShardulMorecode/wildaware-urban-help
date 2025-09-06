import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Shield, AlertTriangle, Heart } from 'lucide-react';
import { useState } from 'react';
import Header from '@/components/Header';
import { species, safetyGuidelines, Species, SafetyGuideline } from '@/data/wildlife-data';
import snakeImage from '@/assets/snake.jpg';
import monkeyImage from '@/assets/monkey.jpg';
import dogImage from '@/assets/dog.jpg';

const Learn = () => {
  const [selectedSpecies, setSelectedSpecies] = useState<Species | null>(null);
  
  const getSpeciesImage = (speciesName: string) => {
    switch (speciesName.toLowerCase()) {
      case 'snake': return snakeImage;
      case 'monkey': return monkeyImage;
      case 'stray dog': return dogImage;
      default: return '/placeholder.svg';
    }
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'high': return 'bg-destructive text-destructive-foreground';
      case 'medium': return 'bg-warning text-warning-foreground';
      default: return 'bg-success text-success-foreground';
    }
  };

  const getGuidelines = (speciesId: number): SafetyGuideline | undefined => {
    return safetyGuidelines.find(g => g.speciesId === speciesId);
  };

  if (selectedSpecies) {
    const guidelines = getGuidelines(selectedSpecies.id);
    
    return (
      <div className="min-h-screen bg-background">
        <Header />
        
        <main className="container mx-auto px-4 py-4">
          <Button 
            variant="ghost" 
            onClick={() => setSelectedSpecies(null)}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to All Species
          </Button>

          <div className="grid md:grid-cols-2 gap-4 h-[calc(100vh-140px)]">
            {/* Species Info */}
            <Card className="h-full overflow-auto">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{selectedSpecies.commonName}</CardTitle>
                  <Badge className={getRiskColor(selectedSpecies.riskLevel)}>
                    {selectedSpecies.riskLevel} risk
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <img 
                  src={getSpeciesImage(selectedSpecies.commonName)}
                  alt={`${selectedSpecies.commonName} in natural habitat`}
                  className="w-full h-40 object-cover rounded-xl"
                />
                <p className="text-sm text-muted-foreground">{selectedSpecies.description}</p>
                
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold">Common Keywords:</h4>
                  <div className="flex flex-wrap gap-1">
                    {selectedSpecies.keywords.map(keyword => (
                      <Badge key={keyword} variant="outline" className="text-xs">
                        {keyword}
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Safety Guidelines */}
            <Card className="h-full overflow-auto">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Shield className="w-4 h-4" />
                  Safety Guidelines
                </CardTitle>
              </CardHeader>
              
              {guidelines ? (
                <CardContent className="space-y-4">
                  {/* DO's */}
                  <div className="space-y-2">
                    <h4 className="text-sm font-semibold text-success flex items-center gap-2">
                      <Shield className="w-3 h-3" />
                      What TO DO
                    </h4>
                    <ul className="space-y-1">
                      {guidelines.dos.map((item, index) => (
                        <li key={index} className="flex items-start gap-2 text-xs">
                          <div className="w-1.5 h-1.5 bg-success rounded-full mt-1.5 flex-shrink-0" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* DON'Ts */}
                  <div className="space-y-2">
                    <h4 className="text-sm font-semibold text-destructive flex items-center gap-2">
                      <AlertTriangle className="w-3 h-3" />
                      What NOT TO DO
                    </h4>
                    <ul className="space-y-1">
                      {guidelines.donts.map((item, index) => (
                        <li key={index} className="flex items-start gap-2 text-xs">
                          <div className="w-1.5 h-1.5 bg-destructive rounded-full mt-1.5 flex-shrink-0" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* First Aid */}
                  <div className="space-y-2">
                    <h4 className="text-sm font-semibold text-info flex items-center gap-2">
                      <Heart className="w-3 h-3" />
                      First Aid
                    </h4>
                    <div className="bg-accent-soft p-3 rounded-xl text-xs">
                      {guidelines.firstAid}
                    </div>
                  </div>

                  {/* Authority Notes */}
                  {guidelines.authorityNotes && (
                    <div className="space-y-2">
                      <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                        Important Notes
                      </h4>
                      <div className="bg-muted p-3 rounded-xl text-xs text-muted-foreground">
                        {guidelines.authorityNotes}
                      </div>
                    </div>
                  )}
                </CardContent>
              ) : (
                <CardContent>
                  <p className="text-center text-muted-foreground py-8">
                    Safety guidelines not available for this species.
                  </p>
                </CardContent>
              )}
            </Card>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-4">
        <div className="text-center mb-4">
          <h1 className="text-2xl font-bold mb-2">Wildlife Safety Education</h1>
          <p className="text-sm text-muted-foreground max-w-2xl mx-auto">
            Learn about common urban wildlife species and how to safely interact with them.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 h-[calc(100vh-180px)] overflow-auto">
          {species.map((speciesItem) => (
            <Card 
              key={speciesItem.id} 
              className="hover:shadow-card transition-smooth cursor-pointer group"
              onClick={() => setSelectedSpecies(speciesItem)}
            >
              <CardHeader className="p-0">
                <div className="relative overflow-hidden rounded-t-2xl">
                  <img 
                    src={getSpeciesImage(speciesItem.commonName)}
                    alt={`${speciesItem.commonName} information card`}
                    className="w-full h-32 object-cover group-hover:scale-105 transition-smooth"
                  />
                  <div className="absolute top-2 right-2">
                    <Badge className={getRiskColor(speciesItem.riskLevel)}>
                      {speciesItem.riskLevel}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="p-4">
                <div className="space-y-3">
                  <div>
                    <CardTitle className="text-base mb-1">{speciesItem.commonName}</CardTitle>
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {speciesItem.description}
                    </p>
                  </div>
                  
                  <div className="flex flex-wrap gap-1">
                    {speciesItem.keywords.slice(0, 2).map(keyword => (
                      <Badge key={keyword} variant="outline" className="text-xs">
                        {keyword}
                      </Badge>
                    ))}
                    {speciesItem.keywords.length > 2 && (
                      <Badge variant="outline" className="text-xs">
                        +{speciesItem.keywords.length - 2}
                      </Badge>
                    )}
                  </div>
                  
                  <Button variant="outline" size="sm" className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-smooth">
                    View Safety Guide
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
    </div>
  );
};

export default Learn;