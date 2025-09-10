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

    // Fetch all data from Supabase
    const [speciesResult, safetyResult, rescueResult] = await Promise.all([
      supabase.from('species').select('*'),
      supabase.from('safety_guidelines').select('*'),
      supabase.from('rescue_orgs').select('*')
    ]);

    const { data: speciesData, error: speciesError } = speciesResult;
    const { data: safetyData, error: safetyError } = safetyResult;
    const { data: rescueData, error: rescueError } = rescueResult;

    if (speciesError) console.error('Error fetching species:', speciesError);
    if (safetyError) console.error('Error fetching safety guidelines:', safetyError);
    if (rescueError) console.error('Error fetching rescue orgs:', rescueError);

    // Rule-based classification
    const messageLower = message.toLowerCase();
    
    // Detect species first
    let speciesGuess = 'unknown';
    let confidence = 0.3;
    let detectedSpecies = null;

    if (speciesData) {
      for (const species of speciesData) {
        const commonName = species.common_name?.toLowerCase() || '';
        const scientificName = species.scientific_name?.toLowerCase() || '';
        const keywords = species.keywords || [];
        
        if (messageLower.includes(commonName) || 
            (scientificName && messageLower.includes(scientificName))) {
          speciesGuess = species.common_name;
          detectedSpecies = species;
          confidence = 0.8;
          break;
        }
        
        // Check keywords
        for (const keyword of keywords) {
          if (messageLower.includes(keyword.toLowerCase())) {
            speciesGuess = species.common_name;
            detectedSpecies = species;
            confidence = 0.6;
            break;
          }
        }
        
        if (speciesGuess !== 'unknown') break;
      }
    }

    // Detect urgency based on species risk level or message context
    let urgency = 'low';
    if (detectedSpecies && detectedSpecies.risk_level) {
      // Use species risk level for urgency
      const riskLevel = detectedSpecies.risk_level.toLowerCase();
      if (riskLevel === 'high' || riskLevel === 'critical') {
        urgency = 'high';
      } else if (riskLevel === 'medium' || riskLevel === 'moderate') {
        urgency = 'medium';
      } else {
        urgency = 'low';
      }
    } else {
      // Fallback to message context if no species detected
      if (messageLower.includes('emergency') || 
          messageLower.includes('urgent') || 
          messageLower.includes('attack') || 
          messageLower.includes('bite') ||
          messageLower.includes('help me')) {
        urgency = 'high';
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
      reasoning: detectedSpecies ? 
        `Detected ${urgency} urgency situation involving ${speciesGuess} (Risk Level: ${detectedSpecies.risk_level})` :
        `Detected ${urgency} urgency situation involving ${speciesGuess}`
    };

    // Get safety guidelines for identified species
    let safetyGuidelines = null;
    if (speciesGuess !== 'unknown' && safetyData) {
      safetyGuidelines = safetyData.find(guide => 
        guide.species_common_name?.toLowerCase() === speciesGuess.toLowerCase()
      );
    }

    // Generate concise response for chat (3-4 lines)
    let response = '';
    
    if (urgency === 'high') {
      response = `🚨 **HIGH RISK ALERT**: You've encountered a **${speciesGuess}** - this is a dangerous situation.\n`;
      response += `${detectedSpecies ? `Risk Level: ${detectedSpecies.risk_level}. ` : ''}Stay calm, maintain maximum distance, and contact emergency services immediately.\n`;
      response += `Check the safety panel for detailed emergency protocols and first aid information.`;
      
    } else if (speciesGuess !== 'unknown') {
      response = `🐾 **${speciesGuess}** identified - ${detectedSpecies ? `Risk Level: ${detectedSpecies.risk_level}` : 'Caution advised'}.\n`;
      if (detectedSpecies?.scientific_name) {
        response += `*${detectedSpecies.scientific_name}* - `;
      }
      response += `${urgency === 'medium' ? 'Exercise caution and ' : ''}maintain safe distance and avoid sudden movements.\n`;
      response += `Detailed safety guidelines and nearby rescue contacts are available in the side panels.`;
      
    } else {
      response = `🔍 **Species not identified** - Please provide more details (size, color, behavior, location).\n`;
      response += `Meanwhile, maintain safe distance from any wild animal and avoid direct contact.\n`;
      response += `General safety guidelines are shown in the safety panel on the right.`;
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