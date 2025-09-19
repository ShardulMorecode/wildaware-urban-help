import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ClassificationResult {
  speciesGuess: string;
  urgency: 'low' | 'medium' | 'high';
  intent: 'guidance' | 'call_help' | 'report_sighting';
  confidence: number;
  reasoning: string;
}

interface RAGResponse {
  response: string;
  classification: ClassificationResult;
}

export function useRAGChat() {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const sendMessage = useCallback(async (message: string, userCity?: string): Promise<RAGResponse | null> => {
    setIsLoading(true);
    
    try {
      console.log('Sending message to RAG chat:', message);
      
      const { data, error } = await supabase.functions.invoke('rag-chat', {
        body: { 
          message,
          userCity: userCity || localStorage.getItem('wildaware-city') || ''
        }
      });

      if (error) {
        console.error('RAG chat error:', error);
        throw error;
      }

      console.log('RAG chat response:', data);
      return data as RAGResponse;

    } catch (error) {
      console.error('Error in RAG chat:', error);
      toast({
        title: "Communication Error",
        description: "Unable to process your message. Please try again.",
        variant: "destructive",
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const initializeKnowledgeBase = useCallback(async () => {
    try {
      toast({
        title: "Updating Knowledge Base",
        description: "This may take a few moments...",
      });

      const { data, error } = await supabase.functions.invoke('embed-knowledge');

      if (error) {
        throw error;
      }

      toast({
        title: "Knowledge Base Updated",
        description: `Successfully processed ${data.processed} items with ${data.inserted} embeddings.`,
      });

      return data;
    } catch (error) {
      console.error('Error initializing knowledge base:', error);
      toast({
        title: "Knowledge Base Error",
        description: "Failed to update knowledge base. Please try again.",
        variant: "destructive",
      });
      return null;
    }
  }, [toast]);

  return {
    sendMessage,
    initializeKnowledgeBase,
    isLoading
  };
}