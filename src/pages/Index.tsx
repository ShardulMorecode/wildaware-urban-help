import { useState } from 'react';
import Header from '@/components/Header';
import ChatInterface from '@/components/ChatInterface';
import SafetyPanel from '@/components/SafetyPanel';
import RescueList from '@/components/RescueList';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ArrowRight, Shield, Users, AlertTriangle } from 'lucide-react';
import { ClassificationResult } from '@/utils/wildlife-classifier';
import heroImage from '@/assets/hero-wildlife.jpg';

const Index = () => {
  const [currentClassification, setCurrentClassification] = useState<ClassificationResult | undefined>();
  const [userCity] = useState(() => localStorage.getItem('wildaware-city') || '');

  const handleClassification = (result: ClassificationResult) => {
    setCurrentClassification(result);
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
            <Button variant="hero" size="lg" className="shadow-glow">
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

      {/* Main Chat Interface */}
      <main className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-7 gap-6 h-[calc(100vh-200px)]">
          {/* Chat Area - 70% */}
          <div className="lg:col-span-5">
            <Card className="h-full flex flex-col shadow-card">
              <div className="p-4 border-b">
                <h2 className="text-xl font-semibold flex items-center gap-2">
                  <Shield className="w-5 h-5 text-primary" />
                  Wildlife Safety Assistant
                </h2>
                <p className="text-sm text-muted-foreground">
                  Describe any wildlife encounter for immediate safety guidance
                </p>
              </div>
              <div className="flex-1 overflow-hidden">
                <ChatInterface onClassification={handleClassification} />
              </div>
            </Card>
          </div>

          {/* Sidebar - 30% */}
          <div className="lg:col-span-2 space-y-6">
            {/* Safety Panel */}
            <div className="h-1/2">
              <SafetyPanel classification={currentClassification} />
            </div>

            {/* Rescue Organizations */}
            <div className="h-1/2">
              <RescueList 
                classification={currentClassification} 
                userCity={userCity}
              />
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="mt-12 grid md:grid-cols-3 gap-6">
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
      </main>
    </div>
  );
};

export default Index;
