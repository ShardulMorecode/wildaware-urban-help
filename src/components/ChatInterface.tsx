import { useState, useRef, useEffect } from 'react';
import { Send, Camera, MapPin, Shield, Phone, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ClassificationResult {
  speciesGuess: string;
  urgency: 'low' | 'medium' | 'high';
  intent: 'guidance' | 'call_help' | 'report_sighting';
  confidence: number;
  reasoning: string;
}

interface Message {
  id: number;
  text: string;
  sender: 'user' | 'system';
  timestamp: Date;
  classification?: ClassificationResult;
}

const ChatInterface = ({ onClassification }: { onClassification: (result: ClassificationResult) => void }) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      text: "Hello! I'm your WildAware assistant. I have access to comprehensive Indian wildlife databases, rescue organizations, and safety protocols. Describe any wildlife encounter and I'll provide expert guidance. Are you currently in a safe location?",
      sender: 'system',
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      id: Date.now(),
      text: input,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);
    setInput('');

    try {
      // Call wildlife chat function
      const { data, error } = await supabase.functions.invoke('wildlife-chat', {
        body: { 
          message: input
        }
      });

      if (error) throw error;

      const { response, classification } = data;
      
      // Update classification in parent component
      if (classification) {
        onClassification(classification);
      }

      const systemMessage: Message = {
        id: Date.now() + 1,
        text: response,
        sender: 'system',
        timestamp: new Date(),
        classification
      };
      
      setMessages(prev => [...prev, systemMessage]);
      
    } catch (error) {
      console.error('Chat error:', error);
      toast({
        title: "Connection Error",
        description: "Unable to get response. Please try again.",
        variant: "destructive",
      });
      
      // Fallback message
      const errorMessage: Message = {
        id: Date.now() + 1,
        text: "I'm sorry, I'm having trouble connecting right now. If this is an emergency, please contact local wildlife rescue services immediately.",
        sender: 'system',
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };


  const handleQuickAction = (action: string) => {
    setInput(action);
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'high': return 'bg-destructive text-destructive-foreground';
      case 'medium': return 'bg-warning text-warning-foreground';
      default: return 'bg-success text-success-foreground';
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <Card className={`max-w-[80%] p-4 ${
              message.sender === 'user' 
                ? 'bg-primary text-primary-foreground' 
                : 'bg-card'
            }`}>
              <div className="whitespace-pre-wrap text-sm">
                {message.text}
              </div>
              {message.classification && (
                <div className="mt-3 flex flex-wrap gap-2">
                  <Badge variant="outline" className="text-xs">
                    {message.classification.speciesGuess}
                  </Badge>
                  <Badge className={`text-xs ${getUrgencyColor(message.classification.urgency)}`}>
                    {message.classification.urgency} urgency
                  </Badge>
                  <Badge variant="secondary" className="text-xs">
                    {Math.round(message.classification.confidence * 100)}% confident
                  </Badge>
                </div>
              )}
              <div className="mt-2 text-xs opacity-70">
                {message.timestamp.toLocaleTimeString()}
              </div>
            </Card>
          </div>
        ))}
        
        {isLoading && (
          <div className="flex justify-start">
            <Card className="bg-card p-4">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-primary rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                <span className="text-sm text-muted-foreground ml-2">Analyzing...</span>
              </div>
            </Card>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Action Chips */}
      <div className="p-4 border-t">
        <div className="flex flex-wrap gap-2 mb-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleQuickAction('I saw a snake in my garden, what should I do?')}
            className="rounded-full"
          >
            <Shield className="w-4 h-4 mr-2" />
            Safety Tips
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleQuickAction('I want to report a monkey sighting in Delhi')}
            className="rounded-full"
          >
            <Camera className="w-4 h-4 mr-2" />
            Report Sighting
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleQuickAction('Emergency: Snake in my house in Mumbai, need immediate rescue')}
            className="rounded-full"
          >
            <Phone className="w-4 h-4 mr-2" />
            Emergency Help
          </Button>
        </div>

        {/* Input Area */}
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Describe your wildlife encounter... (e.g., 'snake in my bedroom')"
              className="min-h-[60px] rounded-2xl resize-none pr-20"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              aria-label="Describe your wildlife encounter"
            />
            <div className="absolute right-2 bottom-2 flex gap-1">
              <Button size="icon" variant="ghost" className="h-8 w-8" aria-label="Share location">
                <MapPin className="w-4 h-4" />
              </Button>
              <Button size="icon" variant="ghost" className="h-8 w-8" aria-label="Attach photo">
                <Camera className="w-4 h-4" />
              </Button>
            </div>
          </div>
          <Button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            size="touch"
            variant="nature"
            className="self-end"
            aria-label="Send message"
          >
            <Send className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;