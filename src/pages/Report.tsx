import { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Camera, MapPin, CheckCircle, Calendar, FileDown } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Header from '@/components/Header';
import { addSighting, sightings } from '@/data/wildlife-data';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const Report = () => {
  const [formData, setFormData] = useState({
    species: '',
    location: '',
    description: '',
    city: localStorage.getItem('wildaware-city') || '',
    observerName: '',
    date: new Date().toISOString().split('T')[0],
    time: new Date().toLocaleTimeString('en-US', { hour12: false }).slice(0,5),
    weather: '',
    animalBehavior: '',
    urgencyLevel: ''
  });
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const reportRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const generatePDF = async (reportData: any) => {
    const pdf = new jsPDF();
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    
    // Title
    pdf.setFontSize(20);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Wildlife Monitoring Report', pageWidth / 2, 30, { align: 'center' });
    
    // Report details
    let yPosition = 60;
    const lineHeight = 10;
    
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'normal');
    
    const reportFields = [
      ['Observer Name:', reportData.observerName],
      ['Date:', reportData.date],
      ['Time:', reportData.time],
      ['Wildlife Species:', reportData.species],
      ['City:', reportData.city],
      ['Specific Location:', reportData.location],
      ['Weather Conditions:', reportData.weather],
      ['Animal Behavior:', reportData.animalBehavior],
      ['Urgency Level:', reportData.urgencyLevel],
      ['Description:', reportData.description]
    ];
    
    reportFields.forEach(([label, value]) => {
      if (value) {
        pdf.setFont('helvetica', 'bold');
        pdf.text(label, 20, yPosition);
        pdf.setFont('helvetica', 'normal');
        
        if (label === 'Description:') {
          const splitText = pdf.splitTextToSize(value, pageWidth - 40);
          pdf.text(splitText, 20, yPosition + lineHeight);
          yPosition += lineHeight * splitText.length + 5;
        } else {
          pdf.text(value, 80, yPosition);
          yPosition += lineHeight + 5;
        }
      }
    });
    
    // Add timestamp
    pdf.setFontSize(10);
    pdf.text(`Generated on: ${new Date().toLocaleString()}`, 20, pageHeight - 20);
    
    return pdf;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.species || !formData.location || !formData.description || !formData.observerName) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Generate PDF report
      const pdf = await generatePDF(formData);
      
      // Create filename with timestamp
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const fileName = `wildlife-report-${timestamp}.pdf`;
      
      // Save PDF to downloads (simulating save to report folder)
      pdf.save(fileName);
      
      // Add to sightings data
      const newSighting = addSighting({
        species: formData.species,
        location: formData.location,
        description: formData.description
      });

      setShowSuccess(true);
      setIsSubmitting(false);
      
      toast({
        title: "Report Generated Successfully",
        description: `PDF report saved as ${fileName}`,
        variant: "default"
      });

      // Reset form
      setFormData({
        species: '',
        location: '',
        description: '',
        city: formData.city,
        observerName: '',
        date: new Date().toISOString().split('T')[0],
        time: new Date().toLocaleTimeString('en-US', { hour12: false }).slice(0,5),
        weather: '',
        animalBehavior: '',
        urgencyLevel: ''
      });
      setSelectedImage(null);

      // Hide success message after 5 seconds
      setTimeout(() => setShowSuccess(false), 5000);
    } catch (error) {
      setIsSubmitting(false);
      toast({
        title: "Error",
        description: "Failed to generate report. Please try again.",
        variant: "destructive"
      });
    }
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
                {/* Observer Name */}
                <div className="space-y-2">
                  <Label htmlFor="observerName" className="text-sm font-medium">
                    Observer Name <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="observerName"
                    value={formData.observerName}
                    onChange={(e) => handleInputChange('observerName', e.target.value)}
                    placeholder="Your full name"
                    className="rounded-xl"
                  />
                </div>

                {/* Date and Time */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="date" className="text-sm font-medium">
                      Date <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="date"
                      type="date"
                      value={formData.date}
                      onChange={(e) => handleInputChange('date', e.target.value)}
                      className="rounded-xl"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="time" className="text-sm font-medium">
                      Time <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="time"
                      type="time"
                      value={formData.time}
                      onChange={(e) => handleInputChange('time', e.target.value)}
                      className="rounded-xl"
                    />
                  </div>
                </div>

                {/* Species */}
                <div className="space-y-2">
                  <Label htmlFor="species" className="text-sm font-medium">
                    Wildlife Species <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="species"
                    value={formData.species}
                    onChange={(e) => handleInputChange('species', e.target.value)}
                    placeholder="e.g., Snake, Monkey, Elephant, etc."
                    className="rounded-xl"
                  />
                </div>

                {/* City */}
                <div className="space-y-2">
                  <Label htmlFor="city" className="text-sm font-medium">
                    City <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="city"
                    value={formData.city}
                    onChange={(e) => handleInputChange('city', e.target.value)}
                    placeholder="Your city name"
                    className="rounded-xl"
                  />
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

                {/* Weather Conditions */}
                <div className="space-y-2">
                  <Label htmlFor="weather" className="text-sm font-medium">
                    Weather Conditions
                  </Label>
                  <Input
                    id="weather"
                    value={formData.weather}
                    onChange={(e) => handleInputChange('weather', e.target.value)}
                    placeholder="e.g., Sunny, Rainy, Cloudy, etc."
                    className="rounded-xl"
                  />
                </div>

                {/* Animal Behavior */}
                <div className="space-y-2">
                  <Label htmlFor="animalBehavior" className="text-sm font-medium">
                    Animal Behavior
                  </Label>
                  <Input
                    id="animalBehavior"
                    value={formData.animalBehavior}
                    onChange={(e) => handleInputChange('animalBehavior', e.target.value)}
                    placeholder="e.g., Aggressive, Calm, Feeding, etc."
                    className="rounded-xl"
                  />
                </div>

                {/* Urgency Level */}
                <div className="space-y-2">
                  <Label htmlFor="urgencyLevel" className="text-sm font-medium">
                    Urgency Level
                  </Label>
                  <Input
                    id="urgencyLevel"
                    value={formData.urgencyLevel}
                    onChange={(e) => handleInputChange('urgencyLevel', e.target.value)}
                    placeholder="e.g., Low, Medium, High, Emergency"
                    className="rounded-xl"
                  />
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <Label htmlFor="description" className="text-sm font-medium">
                    Detailed Description <span className="text-destructive">*</span>
                  </Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    placeholder="Describe the animal's behavior, size, condition, and any other relevant details..."
                    className="min-h-[120px] rounded-xl"
                  />
                </div>

                {/* Photo Upload */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Photo (Optional)</Label>
                  <div className="border-2 border-dashed border-muted rounded-xl p-4">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => setSelectedImage(e.target.files?.[0] || null)}
                      className="w-full"
                    />
                    {selectedImage && (
                      <p className="text-xs text-muted-foreground mt-2">
                        Selected: {selectedImage.name}
                      </p>
                    )}
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