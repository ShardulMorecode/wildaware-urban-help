import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '@/components/Header';
import { AuthDialog } from '@/components/AuthDialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ArrowRight, Shield, Users, AlertTriangle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { WildlifeMonitoringPanel } from '@/components/WildlifeMonitoringPanel';
import heroImage from '@/assets/hero-wildlife.jpg';

const Index = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [showAuthDialog, setShowAuthDialog] = useState(false);

  const handleStartChat = () => {
    if (!user) {
      setShowAuthDialog(true);
    } else {
      navigate('/chat');
    }
  };

  const handleAuthSuccess = () => {
    setShowAuthDialog(false);
    navigate('/chat');
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Hero Section */}
      <section className="relative bg-gradient-hero overflow-hidden h-[60vh]">
        <div className="absolute inset-0">
          <img 
            src={heroImage}
            alt="Urban wildlife coexistence - people safely observing wildlife from distance"
            className="w-full h-full object-cover opacity-20"
          />
        </div>
        <div className="relative container mx-auto px-4 py-8 text-center h-full flex flex-col justify-center">
          <h1 className="text-3xl md:text-4xl font-bold mb-4 text-foreground">
            Stay Safe with
            <span className="block bg-gradient-nature bg-clip-text text-transparent">
              Urban Wildlife
            </span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-6">
            Get instant safety guidance for wildlife encounters. Chat with our AI assistant 
            for immediate help and connect with local rescue teams.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button variant="hero" className="shadow-glow" onClick={handleStartChat}>
              <Shield className="w-4 h-4 mr-2" />
              Start Safety Chat
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
            <Button variant="outline" asChild>
              <a href="/learn">
                <Users className="w-4 h-4 mr-2" />
                Learn About Wildlife
              </a>
            </Button>
          </div>
        </div>
      </section>

      {/* Feature Highlights */}
      <section className="container mx-auto px-4 py-6">
        <div className="grid md:grid-cols-3 gap-4 mb-6">
          <Card className="p-4 text-center hover:shadow-card transition-smooth">
            <Shield className="w-8 h-8 text-primary mx-auto mb-3" />
            <h3 className="text-base font-semibold mb-2">Instant Safety Tips</h3>
            <p className="text-xs text-muted-foreground">
              Get immediate do's and don'ts for any wildlife encounter
            </p>
          </Card>
          
          <Card className="p-4 text-center hover:shadow-card transition-smooth">
            <Users className="w-8 h-8 text-accent mx-auto mb-3" />
            <h3 className="text-base font-semibold mb-2">Local Rescue Teams</h3>
            <p className="text-xs text-muted-foreground">
              Connect with verified rescue organizations in your area
            </p>
          </Card>
          
          <Card className="p-4 text-center hover:shadow-card transition-smooth">
            <AlertTriangle className="w-8 h-8 text-warning mx-auto mb-3" />
            <h3 className="text-base font-semibold mb-2">Emergency Response</h3>
            <p className="text-xs text-muted-foreground">
              24/7 emergency helplines and first aid guidance
            </p>
          </Card>
        </div>

        {/* Wildlife Monitoring Panel */}
        <div className="max-w-4xl mx-auto">
          <WildlifeMonitoringPanel />
        </div>
      </section>


      {/* Auth Dialog */}
      <AuthDialog 
        open={showAuthDialog} 
        onOpenChange={setShowAuthDialog}
        onSuccess={handleAuthSuccess}
      />
    </div>
  );
};

export default Index;
