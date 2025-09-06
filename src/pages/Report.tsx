import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Camera, MapPin, CheckCircle, Calendar } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Header from '@/components/Header';
import { addSighting, sightings } from '@/data/wildlife-data';

const Report = () => {
  const [formData, setFormData] = useState({
    species: '',
    location: '',
    description: '',
    city: localStorage.getItem('wildaware-city') || ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const { toast } = useToast();

  const cities = [
    'Thiruvananthapuram', 'Kochi', 'Kozhikode', 'Thrissur', 'Palakkad',
    'Alappuzha', 'Kollam', 'Kannur', 'Kasaragod', 'Malappuram'
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.species || !formData.location || !formData.description) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);

    // Simulate API call
    setTimeout(() => {
      const newSighting = addSighting({
        species: formData.species,
        location: formData.location,
        description: formData.description
      });

      setShowSuccess(true);
      setIsSubmitting(false);
      
      toast({
        title: "Sighting Reported",
        description: "Thank you for contributing to wildlife tracking!",
        variant: "default"
      });

      // Reset form
      setFormData({
        species: '',
        location: '',
        description: '',
        city: formData.city
      });

      // Hide success message after 5 seconds
      setTimeout(() => setShowSuccess(false), 5000);
    }, 1500);
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (showSuccess) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        
        <main className="container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto">
            <Card className="border-success border-2">
              <CardContent className="text-center py-12">
                <CheckCircle className="w-16 h-16 text-success mx-auto mb-6" />
                <h2 className="text-2xl font-bold mb-4">Sighting Reported Successfully!</h2>
                <p className="text-muted-foreground mb-6">
                  Your wildlife sighting has been recorded and will help track wildlife patterns in your area.
                </p>
                <div className="space-y-4">
                  <Button 
                    onClick={() => setShowSuccess(false)}
                    variant="default"
                    size="lg"
                  >
                    Report Another Sighting
                  </Button>
                  <div className="text-sm text-muted-foreground">
                    <p>Total sightings recorded: {sightings.length}</p>
                  </div>
                </div>
              </CardContent>
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
        <div className="max-w-2xl mx-auto h-[calc(100vh-120px)] overflow-auto">
          <div className="text-center mb-4">
            <h1 className="text-2xl font-bold mb-2">Report Wildlife Sighting</h1>
            <p className="text-sm text-muted-foreground">
              Help us track urban wildlife patterns in your area
            </p>
          </div>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <MapPin className="w-4 h-4 text-primary" />
                Sighting Details
              </CardTitle>
            </CardHeader>
            
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Species Selection */}
                <div className="space-y-2">
                  <Label htmlFor="species" className="text-sm font-medium">
                    Wildlife Species <span className="text-destructive">*</span>
                  </Label>
                  <Select 
                    value={formData.species} 
                    onValueChange={(value) => handleInputChange('species', value)}
                  >
                    <SelectTrigger id="species" className="rounded-xl">
                      <SelectValue placeholder="Select the species you encountered" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="snake">Snake</SelectItem>
                      <SelectItem value="monkey">Monkey</SelectItem>
                      <SelectItem value="dog">Stray Dog</SelectItem>
                      <SelectItem value="cat">Stray Cat</SelectItem>
                      <SelectItem value="bird">Bird of Prey</SelectItem>
                      <SelectItem value="other">Other Wildlife</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* City Selection */}
                <div className="space-y-2">
                  <Label htmlFor="city" className="text-sm font-medium">
                    City <span className="text-destructive">*</span>
                  </Label>
                  <Select 
                    value={formData.city} 
                    onValueChange={(value) => handleInputChange('city', value)}
                  >
                    <SelectTrigger id="city" className="rounded-xl">
                      <SelectValue placeholder="Select your city" />
                    </SelectTrigger>
                    <SelectContent>
                      {cities.map(city => (
                        <SelectItem key={city} value={city}>{city}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Location */}
                <div className="space-y-2">
                  <Label htmlFor="location" className="text-sm font-medium">
                    Specific Location <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="location"
                    value={formData.location}
                    onChange={(e) => handleInputChange('location', e.target.value)}
                    placeholder="e.g., Near City Park, Residential Area, School Campus"
                    className="rounded-xl"
                  />
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <Label htmlFor="description" className="text-sm font-medium">
                    Description <span className="text-destructive">*</span>
                  </Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    placeholder="Describe the animal's behavior, size, and any other relevant details..."
                    className="min-h-[120px] rounded-xl"
                  />
                </div>

                {/* Photo Upload Placeholder */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Photo (Optional)</Label>
                  <div className="border-2 border-dashed border-muted rounded-xl p-4 text-center">
                    <Camera className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-xs text-muted-foreground mb-1">
                      Photo upload coming soon
                    </p>
                    <p className="text-xs text-muted-foreground">
                      For now, include photo details in the description
                    </p>
                  </div>
                </div>

                {/* Submit Button */}
                <div className="pt-2">
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full"
                    variant="nature"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                        Submitting Report...
                      </>
                    ) : (
                      <>
                        <MapPin className="w-4 h-4 mr-2" />
                        Submit Sighting Report
                      </>
                    )}
                  </Button>
                </div>

                <p className="text-xs text-muted-foreground text-center">
                  Your report helps wildlife researchers and rescue teams track urban wildlife patterns.
                </p>
              </form>
            </CardContent>
          </Card>

          {/* Recent Sightings */}
          {sightings.length > 0 && (
            <Card className="mt-4">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Recent Community Sightings
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-40 overflow-auto">
                  {sightings.slice(-2).reverse().map((sighting) => (
                    <div key={sighting.id} className="border rounded-xl p-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="text-sm font-semibold">{sighting.species}</h4>
                          <p className="text-xs text-muted-foreground">{sighting.location}</p>
                          <p className="text-xs mt-1 line-clamp-2">{sighting.description}</p>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {sighting.timestamp.toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <p className="text-center text-xs text-muted-foreground mt-2">
                  Total community sightings: {sightings.length}
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
};

export default Report;