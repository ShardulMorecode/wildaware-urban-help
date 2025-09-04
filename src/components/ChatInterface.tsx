import { useState, useRef, useEffect } from 'react';
import { Send, Camera, MapPin, Shield, Phone, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { classifyWildlifeEncounter, ClassificationResult } from '@/utils/wildlife-classifier';

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
      text: "Hello! I'm your WildAware assistant. Describe any wildlife encounter and I'll provide immediate safety guidance. Are you currently in a safe location?",
      sender: 'system',
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

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

    // Classify the message
    const classification = classifyWildlifeEncounter(input);
    onClassification(classification);

    // Generate response based on classification
    const responseText = generateResponse(classification);
    
    setTimeout(() => {
      const systemMessage: Message = {
        id: Date.now() + 1,
        text: responseText,
        sender: 'system',
        timestamp: new Date(),
        classification
      };
      
      setMessages(prev => [...prev, systemMessage]);
      setIsLoading(false);
    }, 1000);

    setInput('');
  };

  const generateResponse = (classification: ClassificationResult): string => {
    const { speciesGuess, urgency, intent, confidence } = classification;

    let response = '';

    if (urgency === 'high') {
      response = `🚨 HIGH URGENCY DETECTED - ${speciesGuess.toUpperCase()} ENCOUNTER\n\n`;
      response += `IMMEDIATE ACTIONS:\n`;
      if (speciesGuess === 'snake') {
        response += `• Keep 6+ feet distance\n• Secure children/pets\n• Do NOT approach\n• Call rescue immediately\n\n`;
      } else if (speciesGuess === 'monkey') {
        response += `• Avoid eye contact\n• Back away slowly\n• Secure all food\n• Do not run\n\n`;
      } else if (speciesGuess === 'dog') {
        response += `• Stand still, no sudden moves\n• Avoid eye contact\n• Do not run or shout\n• Speak calmly\n\n`;
      }
      response += `Check the Safety Panel → for detailed guidance and emergency contacts.`;
    } else {
      response = `Based on your description, I've identified this as a ${speciesGuess} encounter with ${urgency} urgency.\n\n`;
      
      if (intent === 'call_help') {
        response += `I'll show you rescue organizations in your area. Check the "Nearby Help" section →`;
      } else if (intent === 'report_sighting') {
        response += `You can report this sighting using the Report page. This helps track wildlife patterns in your area.`;
      } else {
        response += `I've loaded specific safety guidelines for ${speciesGuess} encounters. Follow the DO's and avoid the DON'Ts listed in the Safety Panel →`;
      }
    }

    if (confidence < 0.7) {
      response += `\n\n⚠️ If this doesn't match your situation, please provide more details about the animal's appearance and behavior.`;
    }

    return response;
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
            onClick={() => handleQuickAction('I saw a snake in my garden')}
            className="rounded-full"
          >
            <Shield className="w-4 h-4 mr-2" />
            Safety Tips
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleQuickAction('I want to report a monkey sighting')}
            className="rounded-full"
          >
            <Camera className="w-4 h-4 mr-2" />
            Report Sighting
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleQuickAction('Who to call for snake rescue?')}
            className="rounded-full"
          >
            <Phone className="w-4 h-4 mr-2" />
            Call Help
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