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

    // Get safety guidelines for identified species
    let safetyGuidelines = null;
    if (speciesGuess !== 'unknown' && safetyData) {
      safetyGuidelines = safetyData.find(guide => 
        guide.species_common_name?.toLowerCase() === speciesGuess.toLowerCase()
      );
    }

    // Generate comprehensive response
    let response = '';
    
    if (urgency === 'high') {
      response = '🚨 **URGENT EMERGENCY**: This is a high-risk situation. ';
      if (speciesGuess !== 'unknown') {
        response += `You've encountered a ${speciesGuess}. `;
        
        // Add specific emergency dos and don'ts
        if (safetyGuidelines) {
          response += '\n\n**IMMEDIATE SAFETY ACTIONS:**\n';
          if (safetyGuidelines.dos) {
            response += `✅ **DO**: ${safetyGuidelines.dos}\n`;
          }
          if (safetyGuidelines.donts) {
            response += `❌ **DON'T**: ${safetyGuidelines.donts}\n`;
          }
          if (safetyGuidelines.first_aid) {
            response += `🏥 **FIRST AID**: ${safetyGuidelines.first_aid}\n`;
          }
        }
      }
      response += '\n🆘 **Contact emergency services immediately!**';
      
    } else if (speciesGuess !== 'unknown') {
      response = `I've identified this as likely involving a **${speciesGuess}**. `;
      
      if (urgency === 'medium') {
        response += 'This requires caution. ';
      }
      
      // Add comprehensive safety guidelines
      if (safetyGuidelines) {
        response += '\n\n**SAFETY GUIDELINES:**\n';
        if (safetyGuidelines.dos) {
          response += `✅ **What to DO**: ${safetyGuidelines.dos}\n\n`;
        }
        if (safetyGuidelines.donts) {
          response += `❌ **What NOT to do**: ${safetyGuidelines.donts}\n\n`;
        }
        if (safetyGuidelines.first_aid) {
          response += `🏥 **First Aid**: ${safetyGuidelines.first_aid}\n\n`;
        }
        if (safetyGuidelines.authority_notes) {
          response += `📋 **Important Notes**: ${safetyGuidelines.authority_notes}`;
        }
      } else {
        response += 'Please maintain a safe distance and contact local wildlife authorities for guidance.';
      }
      
    } else {
      response = 'I understand you have a wildlife-related query. While I couldn\'t identify the specific species, I can provide general wildlife safety advice.\n\n';
      response += '🛡️ **General Safety Tips:**\n';
      response += '• Maintain a safe distance from any wild animal\n';
      response += '• Do not attempt to feed or approach the animal\n';
      response += '• Make yourself appear larger and back away slowly\n';
      response += '• Contact local wildlife authorities for assistance\n\n';
      response += 'Please provide more details about the animal (size, color, behavior) for specific guidance.';
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