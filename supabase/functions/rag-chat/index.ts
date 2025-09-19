import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.0';
import { GoogleGenerativeAI } from 'https://esm.sh/@google/generative-ai@0.21.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Initialize clients
const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

const genAI = new GoogleGenerativeAI(Deno.env.get('GEMINI_API_KEY') ?? '');

interface ClassificationResult {
  speciesGuess: string;
  urgency: 'low' | 'medium' | 'high';
  intent: 'guidance' | 'call_help' | 'report_sighting';
  confidence: number;
  reasoning: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, userCity } = await req.json();
    console.log('Received message:', message, 'User city:', userCity);

    // Step 1: Generate embedding for the user message
    const embedding = await generateEmbedding(message);
    console.log('Generated embedding for message');

    // Step 2: Perform vector similarity search
    const relevantKnowledge = await searchKnowledge(embedding, message);
    console.log('Found relevant knowledge:', relevantKnowledge.length, 'items');

    // Step 3: Generate response using Gemini with RAG context
    const { response, classification } = await generateRAGResponse(message, relevantKnowledge, userCity);
    console.log('Generated RAG response with classification:', classification);

    return new Response(
      JSON.stringify({ response, classification }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in rag-chat function:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        response: "I'm having trouble processing your request right now. Please try again.",
        classification: {
          speciesGuess: "unknown",
          urgency: "medium",
          intent: "guidance",
          confidence: 0.1,
          reasoning: "Error occurred during processing"
        }
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});

async function generateEmbedding(text: string): Promise<number[]> {
  try {
    // Use a simple embedding generation approach
    // In production, you might want to use a dedicated embedding model
    const model = genAI.getGenerativeModel({ model: "text-embedding-004" });
    const result = await model.embedContent(text);
    return result.embedding.values;
  } catch (error) {
    console.error('Error generating embedding:', error);
    // Fallback: create a simple hash-based embedding
    const simpleEmbedding = new Array(384).fill(0);
    for (let i = 0; i < text.length && i < 384; i++) {
      simpleEmbedding[i] = text.charCodeAt(i) / 255;
    }
    return simpleEmbedding;
  }
}

async function searchKnowledge(embedding: number[], query: string, limit: number = 5) {
  try {
    // First, try to get embeddings if they exist
    const { data: embeddingResults, error: embeddingError } = await supabase
      .rpc('match_knowledge', {
        query_embedding: embedding,
        match_threshold: 0.7,
        match_count: limit
      });

    if (embeddingError) {
      console.log('Vector search not available, falling back to keyword search');
    }

    // Fallback to keyword-based search
    const [speciesResults, safetyResults, rescueResults] = await Promise.all([
      // Search species
      supabase
        .from('species')
        .select('*')
        .or(`common_name.ilike.%${query}%,scientific_name.ilike.%${query}%,keywords.cs.{${query.toLowerCase()}}`),
      
      // Search safety guidelines
      supabase
        .from('safety_guidelines')
        .select('*')
        .or(`species_common_name.ilike.%${query}%,dos.ilike.%${query}%,donts.ilike.%${query}%`),
      
      // Search rescue organizations
      supabase
        .from('rescue_orgs')
        .select('*')
        .or(`name.ilike.%${query}%,species_supported.cs.{${query.toLowerCase()}}`)
    ]);

    const relevantKnowledge = [
      ...(speciesResults.data || []).map(item => ({
        type: 'species',
        content: `Species: ${item.common_name} (${item.scientific_name}), Risk Level: ${item.risk_level}`,
        data: item
      })),
      ...(safetyResults.data || []).map(item => ({
        type: 'safety_guideline',
        content: `Safety for ${item.species_common_name}: DOs: ${item.dos}, DONTs: ${item.donts}`,
        data: item
      })),
      ...(rescueResults.data || []).map(item => ({
        type: 'rescue_org',
        content: `Rescue: ${item.name} in ${item.state}, Supports: ${item.species_supported?.join(', ')}`,
        data: item
      }))
    ];

    return relevantKnowledge;
  } catch (error) {
    console.error('Error searching knowledge:', error);
    return [];
  }
}

async function generateRAGResponse(message: string, knowledge: any[], userCity?: string) {
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  // Build context from retrieved knowledge
  const context = knowledge.map(k => k.content).join('\n');
  
  const prompt = `You are a wildlife safety expert assistant. Based on the user's message and the retrieved knowledge context, provide helpful guidance.

User Message: "${message}"

Retrieved Knowledge Context:
${context}

Instructions:
1. If a specific species is mentioned or can be inferred, provide detailed safety guidelines
2. Include relevant rescue organization contacts if location is provided: ${userCity || 'Not specified'}
3. Assess urgency level (low/medium/high) based on the situation described
4. Determine intent: guidance (general advice), call_help (emergency assistance needed), or report_sighting (wildlife spotted)
5. Provide actionable advice with clear dos and don'ts

Please respond in a helpful, clear manner and include classification details at the end in this format:
CLASSIFICATION: {species: "species_name", urgency: "low/medium/high", intent: "guidance/call_help/report_sighting", confidence: 0.8, reasoning: "explanation"}`;

  try {
    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    
    // Extract classification from response
    const classificationMatch = responseText.match(/CLASSIFICATION:\s*{([^}]+)}/);
    let classification: ClassificationResult = {
      speciesGuess: "unknown",
      urgency: "medium",
      intent: "guidance",
      confidence: 0.5,
      reasoning: "Generated from RAG context"
    };

    if (classificationMatch) {
      try {
        // Parse the classification
        const classificationText = classificationMatch[1];
        const speciesMatch = classificationText.match(/species:\s*"([^"]+)"/);
        const urgencyMatch = classificationText.match(/urgency:\s*"([^"]+)"/);
        const intentMatch = classificationText.match(/intent:\s*"([^"]+)"/);
        const confidenceMatch = classificationText.match(/confidence:\s*([0-9.]+)/);
        const reasoningMatch = classificationText.match(/reasoning:\s*"([^"]+)"/);

        if (speciesMatch) classification.speciesGuess = speciesMatch[1];
        if (urgencyMatch) classification.urgency = urgencyMatch[1] as any;
        if (intentMatch) classification.intent = intentMatch[1] as any;
        if (confidenceMatch) classification.confidence = parseFloat(confidenceMatch[1]);
        if (reasoningMatch) classification.reasoning = reasoningMatch[1];
      } catch (parseError) {
        console.error('Error parsing classification:', parseError);
      }
    }

    // Clean response (remove classification from display text)
    const cleanResponse = responseText.replace(/CLASSIFICATION:\s*{[^}]+}/, '').trim();

    return {
      response: cleanResponse,
      classification
    };

  } catch (error) {
    console.error('Error generating response:', error);
    return {
      response: "I encountered an issue generating a response. Based on the available information, please exercise caution around wildlife and contact local authorities if needed.",
      classification: {
        speciesGuess: "unknown",
        urgency: "medium",
        intent: "guidance",
        confidence: 0.3,
        reasoning: "Fallback response due to generation error"
      }
    };
  }
}