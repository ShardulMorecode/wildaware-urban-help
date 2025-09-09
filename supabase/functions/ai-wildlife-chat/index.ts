import "https://deno.land/x/xhr@0.1.0/mod.ts";
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
    const { message, conversation_history = [] } = await req.json();
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('Received message:', message);

    // For now, let's provide some sample data until sheets are working
    const sampleSpeciesData = [
      { common_name: "Indian Cobra", scientific_name: "Naja naja", risk_level: "High", category: "Venomous Snake" },
      { common_name: "Russell's Viper", scientific_name: "Daboia russelii", risk_level: "High", category: "Venomous Snake" },
      { common_name: "King Cobra", scientific_name: "Ophiophagus hannah", risk_level: "Extreme", category: "Venomous Snake" },
      { common_name: "Leopard", scientific_name: "Panthera pardus", risk_level: "High", category: "Big Cat" },
      { common_name: "Sloth Bear", scientific_name: "Melursus ursinus", risk_level: "High", category: "Bear" },
      { common_name: "Rhesus Macaque", scientific_name: "Macaca mulatta", risk_level: "Medium", category: "Primate" }
    ];

    const sampleRescueOrgs = [
      { name: "Wildlife SOS", state: "Delhi", district: "New Delhi", phone: "9811038009", whatsapp: "9811038009" },
      { name: "Bombay Natural History Society", state: "Maharashtra", district: "Mumbai", phone: "022-28825779", whatsapp: "N/A" },
      { name: "Karnataka Forest Department", state: "Karnataka", district: "Bangalore", phone: "080-22340474", whatsapp: "N/A" },
      { name: "Tamil Nadu Forest Department", state: "Tamil Nadu", district: "Chennai", phone: "044-28415351", whatsapp: "N/A" }
    ];

    const sampleSafetyGuidelines = [
      { situation: "Snake Encounter", dos: "Stay calm, back away slowly, call rescue helpline", donts: "Don't try to catch or kill, don't make sudden movements" },
      { situation: "Leopard Sighting", dos: "Make noise, appear large, contact forest dept immediately", donts: "Don't run, don't approach, don't turn your back" },
      { situation: "Monkey Attack", dos: "Avoid eye contact, back away slowly, use loud noise", donts: "Don't feed them, don't show food, don't corner them" }
    ];

    console.log('Using sample data - Species:', sampleSpeciesData.length, 'Rescue Orgs:', sampleRescueOrgs.length, 'Safety Guidelines:', sampleSafetyGuidelines.length);

    // Create system prompt with sample data
    const systemPrompt = `You are WildAware AI, an expert wildlife safety assistant. You have access to comprehensive databases about Indian wildlife, rescue organizations, and safety protocols.

AVAILABLE DATA:
- ${sampleSpeciesData?.length || 0} species records with behavior, risk levels, and safety information
- ${sampleRescueOrgs?.length || 0} rescue organizations across India with contact details
- ${sampleSafetyGuidelines?.length || 0} situation-specific safety guidelines

SPECIES DATABASE:
${sampleSpeciesData?.slice(0, 20).map(s => `- ${s.common_name} (${s.scientific_name}): Risk Level: ${s.risk_level}, Category: ${s.category}`).join('\n') || 'No species data available'}

RESCUE ORGANIZATIONS (Sample):
${sampleRescueOrgs?.slice(0, 10).map(org => `- ${org.name} (${org.state}, ${org.district}): Phone: ${org.phone}, WhatsApp: ${org.whatsapp}`).join('\n') || 'No rescue org data available'}

SAFETY GUIDELINES:
${sampleSafetyGuidelines?.slice(0, 10).map(sg => `- ${sg.situation}: DO: ${sg.dos} | DON'T: ${sg.donts}`).join('\n') || 'No safety guidelines available'}

INSTRUCTIONS:
1. Analyze user messages for wildlife encounters, safety concerns, or rescue needs
2. Provide immediate safety advice based on the situation
3. Recommend specific rescue organizations when location is mentioned
4. Use the safety guidelines database for situation-specific advice
5. Always prioritize user safety - if high risk, emphasize immediate actions
6. Be conversational but authoritative about safety
7. Ask for location when recommending rescue contacts
8. If species isn't in database, provide general wildlife safety advice

RESPONSE FORMAT:
- Start with immediate safety advice if urgent
- Provide specific, actionable guidance
- Include relevant rescue contacts when appropriate
- End with follow-up questions or next steps

Remember: User safety is paramount. Better to be overly cautious than risk harm.`;

    // Build conversation for OpenAI
    const messages = [
      { role: 'system', content: systemPrompt },
      ...conversation_history.map((msg: any) => ({
        role: msg.sender === 'user' ? 'user' : 'assistant',
        content: msg.text
      })),
      { role: 'user', content: message }
    ];

    console.log('Sending request to OpenAI with', messages.length, 'messages');

    // Call OpenAI
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: messages,
        max_tokens: 800,
        temperature: 0.7,
      }),
    });

    const aiResponse = await response.json();
    console.log('OpenAI response status:', response.status);

    if (!response.ok) {
      console.error('OpenAI error:', aiResponse);
      throw new Error(`OpenAI API error: ${aiResponse.error?.message || 'Unknown error'}`);
    }

    const generatedText = aiResponse.choices[0].message.content;

    // Simple classification for urgency detection
    const urgency = message.toLowerCase().includes('emergency') || 
                   message.toLowerCase().includes('urgent') || 
                   message.toLowerCase().includes('attack') || 
                   message.toLowerCase().includes('bite') ||
                   message.toLowerCase().includes('help me') ? 'high' : 
                   message.toLowerCase().includes('snake') || 
                   message.toLowerCase().includes('rescue') ? 'medium' : 'low';

    // Extract species mentioned in message
    const speciesGuess = sampleSpeciesData?.find((s: any) => 
      message.toLowerCase().includes((s.common_name || '').toLowerCase()) ||
      (s.scientific_name && message.toLowerCase().includes(s.scientific_name.toLowerCase()))
    )?.common_name || 'unknown';

    const classification = {
      speciesGuess,
      urgency,
      intent: message.toLowerCase().includes('rescue') || message.toLowerCase().includes('help') ? 'call_help' :
              message.toLowerCase().includes('report') || message.toLowerCase().includes('sighting') ? 'report_sighting' : 'guidance',
      confidence: speciesGuess !== 'unknown' ? 0.8 : 0.5,
      reasoning: `Detected ${urgency} urgency situation involving ${speciesGuess}`
    };

    console.log('Generated classification:', classification);

    return new Response(JSON.stringify({ 
      response: generatedText, 
      classification 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in ai-wildlife-chat function:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      response: "I'm sorry, I'm having trouble processing your request right now. Please try again or contact emergency services if this is urgent."
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});