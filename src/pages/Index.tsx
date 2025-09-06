import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '@/components/Header';
import { AuthDialog } from '@/components/AuthDialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ArrowRight, Shield, Users, AlertTriangle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
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
      <section className="relative bg-gradient-hero overflow-hidden">
        <div className="absolute inset-0">
          <img 
            src={heroImage}
            alt="Urban wildlife coexistence - people safely observing wildlife from distance"
            className="w-full h-full object-cover opacity-20"
          />
        </div>
        <div className="relative container mx-auto px-4 py-16 text-center">
          <h1 className="text-5xl md:text-6xl font-bold mb-6 text-foreground">
            Stay Safe with
            <span className="block bg-gradient-nature bg-clip-text text-transparent">
              Urban Wildlife
            </span>
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto mb-8">
            Get instant safety guidance for wildlife encounters. Chat with our AI assistant 
            for immediate help and connect with local rescue teams.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button variant="hero" size="lg" className="shadow-glow" onClick={handleStartChat}>
              <Shield className="w-5 h-5 mr-2" />
              Start Safety Chat
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
            <Button variant="outline" size="lg" asChild>
              <a href="/learn">
                <Users className="w-5 h-5 mr-2" />
                Learn About Wildlife
              </a>
            </Button>
          </div>
        </div>
      </section>

      {/* Feature Highlights */}
      <section className="container mx-auto px-4 py-8">
        <div className="grid md:grid-cols-3 gap-6">
          <Card className="p-6 text-center hover:shadow-card transition-smooth">
            <Shield className="w-12 h-12 text-primary mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Instant Safety Tips</h3>
            <p className="text-sm text-muted-foreground">
              Get immediate do's and don'ts for any wildlife encounter
            </p>
          </Card>
          
          <Card className="p-6 text-center hover:shadow-card transition-smooth">
            <Users className="w-12 h-12 text-accent mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Local Rescue Teams</h3>
            <p className="text-sm text-muted-foreground">
              Connect with verified rescue organizations in your area
            </p>
          </Card>
          
          <Card className="p-6 text-center hover:shadow-card transition-smooth">
            <AlertTriangle className="w-12 h-12 text-warning mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Emergency Response</h3>
            <p className="text-sm text-muted-foreground">
              24/7 emergency helplines and first aid guidance
            </p>
          </Card>
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
