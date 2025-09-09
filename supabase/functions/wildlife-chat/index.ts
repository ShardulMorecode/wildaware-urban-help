import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message } = await req.json();
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('Received message:', message);

    // Fetch species data from Supabase
    const { data: speciesData, error: speciesError } = await supabase
      .from('species')
      .select('common_name, scientific_name, risk_level, keywords');

    if (speciesError) {
      console.error('Error fetching species:', speciesError);
    }

    // Rule-based classification
    const messageLower = message.toLowerCase();
    
    // Detect urgency
    let urgency = 'low';
    if (messageLower.includes('emergency') || 
        messageLower.includes('urgent') || 
        messageLower.includes('attack') || 
        messageLower.includes('bite') ||
        messageLower.includes('help me')) {
      urgency = 'high';
    } else if (messageLower.includes('snake') || 
               messageLower.includes('rescue') ||
               messageLower.includes('leopard') ||
               messageLower.includes('bear')) {
      urgency = 'medium';
    }

    // Detect species
    let speciesGuess = 'unknown';
    let confidence = 0.3;

    if (speciesData) {
      for (const species of speciesData) {
        const commonName = species.common_name?.toLowerCase() || '';
        const scientificName = species.scientific_name?.toLowerCase() || '';
        const keywords = species.keywords || [];
        
        if (messageLower.includes(commonName) || 
            (scientificName && messageLower.includes(scientificName))) {
          speciesGuess = species.common_name;
          confidence = 0.8;
          break;
        }
        
        // Check keywords
        for (const keyword of keywords) {
          if (messageLower.includes(keyword.toLowerCase())) {
            speciesGuess = species.common_name;
            confidence = 0.6;
            break;
          }
        }
        
        if (speciesGuess !== 'unknown') break;
      }
    }

    // Detect intent
    let intent = 'guidance';
    if (messageLower.includes('rescue') || messageLower.includes('help')) {
      intent = 'call_help';
    } else if (messageLower.includes('report') || messageLower.includes('sighting')) {
      intent = 'report_sighting';
    }

    const classification = {
      speciesGuess,
      urgency,
      intent,
      confidence,
      reasoning: `Detected ${urgency} urgency situation involving ${speciesGuess}`
    };

    // Generate response based on classification
    let response = '';
    
    if (urgency === 'high') {
      response = '🚨 **URGENT**: This sounds like an emergency situation. ';
      if (speciesGuess !== 'unknown') {
        response += `You've encountered a ${speciesGuess}. `;
      }
      response += 'Stay calm, maintain distance, and contact emergency services or wildlife rescue immediately.';
    } else if (speciesGuess !== 'unknown') {
      response = `I've identified this as likely involving a ${speciesGuess}. `;
      if (urgency === 'medium') {
        response += 'This requires caution. ';
      }
      response += 'Let me provide you with specific safety guidelines for this species.';
    } else {
      response = 'I understand you have a wildlife-related query. While I couldn\'t identify the specific species, I can provide general wildlife safety advice. Please provide more details about the animal or situation.';
    }

    console.log('Generated classification:', classification);

    return new Response(JSON.stringify({ 
      response, 
      classification 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in wildlife-chat function:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      response: "I'm sorry, I'm having trouble processing your request right now. Please try again or contact emergency services if this is urgent."
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});