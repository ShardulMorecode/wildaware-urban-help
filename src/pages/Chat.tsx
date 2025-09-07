import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '@/components/Header';
import ChatInterface from '@/components/ChatInterface';
import SafetyPanel from '@/components/SafetyPanel';
import RescueList from '@/components/RescueList';
import { Card } from '@/components/ui/card';
import { Shield } from 'lucide-react';
interface ClassificationResult {
  speciesGuess: string;
  urgency: 'low' | 'medium' | 'high';
  intent: 'guidance' | 'call_help' | 'report_sighting';
  confidence: number;
  reasoning: string;
}
import { useAuth } from '@/contexts/AuthContext';

const Chat = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [currentClassification, setCurrentClassification] = useState<ClassificationResult | undefined>();
  const [userCity] = useState(() => localStorage.getItem('wildaware-city') || '');

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  const handleClassification = (result: ClassificationResult) => {
    setCurrentClassification(result);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8 text-center">
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-4">
        <div className="grid lg:grid-cols-7 gap-4 h-[calc(100vh-100px)]">
          {/* Chat Area - 70% */}
          <div className="lg:col-span-5">
            <Card className="h-full flex flex-col shadow-card">
              <div className="p-3 border-b">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <Shield className="w-4 h-4 text-primary" />
                  Wildlife Safety Assistant
                </h2>
                <p className="text-xs text-muted-foreground">
                  Describe any wildlife encounter for immediate safety guidance
                </p>
              </div>
              <div className="flex-1 overflow-hidden">
                <ChatInterface onClassification={handleClassification} />
              </div>
            </Card>
          </div>

          {/* Sidebar - 30% */}
          <div className="lg:col-span-2 space-y-3">
            {/* Safety Panel */}
            <div className="h-[45%]">
              <SafetyPanel classification={currentClassification} />
            </div>

            {/* Rescue Organizations */}
            <div className="h-[45%]">
              <RescueList 
                classification={currentClassification} 
                userCity={userCity}
              />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Chat;