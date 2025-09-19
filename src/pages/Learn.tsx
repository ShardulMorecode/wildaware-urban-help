import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Shield, AlertTriangle, Heart } from 'lucide-react';
import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import { supabase } from '@/integrations/supabase/client';
import snakeImage from '@/assets/snake.jpg';
import monkeyImage from '@/assets/monkey.jpg';
import dogImage from '@/assets/dog.jpg';
import asianElephantImage from '@/assets/asian-elephant.jpg';
import asianPalmCivetImage from '@/assets/asian-palm-civet.jpg';
import asiaticLionImage from '@/assets/asiatic-lion.jpg';
import bengalTigerImage from '@/assets/bengal-tiger.jpg';
import bonnetMacaqueImage from '@/assets/bonnet-macaque.jpg';
import commonKraitImage from '@/assets/common-krait.jpg';
import indianCobraImage from '@/assets/indian-cobra.jpg';
import kingCobraImage from '@/assets/king-cobra.jpg';
import indianLeopardImage from '@/assets/indian-leopard.jpg';
import indianFlyingFoxImage from '@/assets/indian-flying-fox.jpg';
import indianPeacockImage from '@/assets/indian-peacock.jpg';
import indianRockPythonImage from '@/assets/indian-rock-python.jpg';
import indianMonitorImage from '@/assets/indian-monitor.jpg';
import indianStarTortoiseImage from '@/assets/indian-star-tortoise.jpg';
import redPandaImage from '@/assets/red-panda.jpg';

interface Species {
  id: string;
  common_name: string;
  scientific_name: string;
  risk_level: string;
  keywords: string[];
  image_ref?: string;
}

interface SafetyGuideline {
  id: string;
  species_common_name: string;
  dos: string;
  donts: string;
  first_aid?: string;
  authority_notes?: string;
}

const Learn = () => {
  const [selectedSpecies, setSelectedSpecies] = useState<Species | null>(null);
  const [allSpecies, setAllSpecies] = useState<Species[]>([]);
  const [guidelines, setGuidelines] = useState<SafetyGuideline | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSpecies();
  }, []);

  useEffect(() => {
    if (selectedSpecies) {
      fetchGuidelines(selectedSpecies.common_name);
    }
  }, [selectedSpecies]);

  const fetchSpecies = async () => {
    try {
      const { data, error } = await supabase
        .from('species')
        .select('*')
        .order('common_name');
      
      if (error) throw error;
      setAllSpecies(data || []);
    } catch (error) {
      console.error('Error fetching species:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchGuidelines = async (speciesName: string) => {
    try {
      const { data, error } = await supabase
        .from('safety_guidelines')
        .select('*')
        .eq('species_common_name', speciesName)
        .maybeSingle();
      
      if (error) throw error;
      setGuidelines(data);
    } catch (error) {
      console.error('Error fetching guidelines:', error);
      setGuidelines(null);
    }
  };
  
  const getSpeciesImage = (speciesName: string, imageRef?: string) => {
    // First priority: use the database image reference (Wikipedia commons)
    if (imageRef) {
      // Convert Wikipedia file page URLs to direct image URLs
      if (imageRef.includes('en.wikipedia.org/wiki/File:')) {
        const fileName = imageRef.split('File:')[1];
        return `https://upload.wikimedia.org/wikipedia/commons/thumb/${fileName.slice(0, 1)}/${fileName.slice(0, 2)}/${fileName}/800px-${fileName}`;
      }
      // For direct Wikipedia commons URLs, use as-is
      if (imageRef.includes('upload.wikimedia.org')) {
        return imageRef;
      }
      return imageRef;
    }
    
    const name = speciesName.toLowerCase();
    
    // Second priority: specific species mappings to our generated images
    if (name.includes('asian elephant')) return asianElephantImage;
    if (name.includes('asian palm civet')) return asianPalmCivetImage;
    if (name.includes('asiatic lion')) return asiaticLionImage;
    if (name.includes('bengal tiger')) return bengalTigerImage;
    if (name.includes('bonnet macaque')) return bonnetMacaqueImage;
    if (name.includes('common krait')) return commonKraitImage;
    if (name.includes('indian cobra')) return indianCobraImage;
    if (name.includes('king cobra')) return kingCobraImage;
    if (name.includes('indian leopard')) return indianLeopardImage;
    if (name.includes('indian flying fox')) return indianFlyingFoxImage;
    if (name.includes('indian peacock')) return indianPeacockImage;
    if (name.includes('indian rock python')) return indianRockPythonImage;
    if (name.includes('indian monitor') || name.includes('bengal monitor')) return indianMonitorImage;
    if (name.includes('indian star tortoise')) return indianStarTortoiseImage;
    if (name.includes('red panda')) return redPandaImage;
    
    // Third priority: generic fallbacks
    if (name.includes('snake') || name.includes('krait') || name.includes('cobra') || name.includes('python')) return snakeImage;
    if (name.includes('monkey') || name.includes('macaque') || name.includes('langur')) return monkeyImage;
    if (name.includes('dog') || name.includes('stray')) return dogImage;
    
    return '/placeholder.svg';
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'high': return 'bg-destructive text-destructive-foreground';
      case 'medium': return 'bg-warning text-warning-foreground';
      default: return 'bg-success text-success-foreground';
    }
  };

  if (selectedSpecies) {
    
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
                  <CardTitle className="text-lg">{selectedSpecies.common_name}</CardTitle>
                  <Badge className={getRiskColor(selectedSpecies.risk_level)}>
                    {selectedSpecies.risk_level} risk
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <img 
                  src={getSpeciesImage(selectedSpecies.common_name, selectedSpecies.image_ref)}
                  alt={`${selectedSpecies.common_name} in natural habitat`}
                  className="w-full h-64 object-cover rounded-xl"
                />
                <p className="text-sm text-muted-foreground">
                  Scientific name: <span className="italic">{selectedSpecies.scientific_name}</span>
                </p>
                
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
                    <div className="bg-accent-soft p-3 rounded-xl text-xs whitespace-pre-line">
                      {guidelines.dos}
                    </div>
                  </div>

                  {/* DON'Ts */}
                  <div className="space-y-2">
                    <h4 className="text-sm font-semibold text-destructive flex items-center gap-2">
                      <AlertTriangle className="w-3 h-3" />
                      What NOT TO DO
                    </h4>
                    <div className="bg-accent-soft p-3 rounded-xl text-xs whitespace-pre-line">
                      {guidelines.donts}
                    </div>
                  </div>

                  {/* First Aid */}
                  {guidelines.first_aid && (
                    <div className="space-y-2">
                      <h4 className="text-sm font-semibold text-info flex items-center gap-2">
                        <Heart className="w-3 h-3" />
                        First Aid
                      </h4>
                      <div className="bg-accent-soft p-3 rounded-xl text-xs whitespace-pre-line">
                        {guidelines.first_aid}
                      </div>
                    </div>
                  )}

                  {/* Authority Notes */}
                  {guidelines.authority_notes && (
                    <div className="space-y-2">
                      <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                        Important Notes
                      </h4>
                      <div className="bg-muted p-3 rounded-xl text-xs text-muted-foreground whitespace-pre-line">
                        {guidelines.authority_notes}
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
          {loading ? (
            <div className="col-span-full text-center py-8">
              <p className="text-muted-foreground">Loading species...</p>
            </div>
          ) : allSpecies.length === 0 ? (
            <div className="col-span-full text-center py-8">
              <p className="text-muted-foreground">No species found.</p>
            </div>
          ) : (
            allSpecies.map((speciesItem) => (
              <Card 
                key={speciesItem.id} 
                className="hover:shadow-card transition-smooth cursor-pointer group"
                onClick={() => setSelectedSpecies(speciesItem)}
              >
                <CardHeader className="p-0">
                  <div className="relative overflow-hidden rounded-t-2xl">
                    <img 
                      src={getSpeciesImage(speciesItem.common_name, speciesItem.image_ref)}
                      alt={`${speciesItem.common_name} information card`}
                      className="w-full h-48 object-cover group-hover:scale-105 transition-smooth"
                    />
                    <div className="absolute top-2 right-2">
                      <Badge className={getRiskColor(speciesItem.risk_level)}>
                        {speciesItem.risk_level}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="p-4">
                  <div className="space-y-3">
                    <div>
                      <CardTitle className="text-base mb-1">{speciesItem.common_name}</CardTitle>
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        <span className="italic">{speciesItem.scientific_name}</span>
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
            ))
          )}
        </div>
      </main>
    </div>
  );
};

export default Learn;