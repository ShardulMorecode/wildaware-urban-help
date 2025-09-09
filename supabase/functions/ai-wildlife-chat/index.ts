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

    // Fetch data directly from Google Sheets
    const sheetUrls = {
      species: 'https://docs.google.com/spreadsheets/d/1xDhXyZMvNtRwKBKo9bPYGsW9jhktQ6Xr-_vLyXtZhKQ/edit?usp=sharing',
      rescueOrgs: 'https://docs.google.com/spreadsheets/d/1SBVOOyKHJHQnXCZXzqZcDYWUl6-k8_E6X9jzePdDQGw/edit?usp=sharing', 
      safetyGuidelines: 'https://docs.google.com/spreadsheets/d/1_xSV6R1IYbCGKCN7XaW8jcO6Kfqy6TdHqJIKJFSTT_M/edit?usp=sharing'
    };

    // Convert Google Sheets URLs to CSV export URLs
    const getCsvUrl = (sheetUrl: string) => {
      const sheetId = sheetUrl.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/)?.[1];
      return `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv`;
    };

    // Fetch and parse CSV data
    const fetchSheetData = async (url: string) => {
      try {
        const response = await fetch(getCsvUrl(url));
        const csvText = await response.text();
        const lines = csvText.split('\n').filter(line => line.trim());
        if (lines.length < 2) return [];
        
        const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim());
        return lines.slice(1).map(line => {
          const values = line.split(',').map(v => v.replace(/"/g, '').trim());
          const obj: any = {};
          headers.forEach((header, index) => {
            obj[header.toLowerCase().replace(/\s+/g, '_')] = values[index] || '';
          });
          return obj;
        });
      } catch (error) {
        console.error('Error fetching sheet data:', error);
        return [];
      }
    };

    const [speciesData, rescueOrgsData, safetyData] = await Promise.all([
      fetchSheetData(sheetUrls.species),
      fetchSheetData(sheetUrls.rescueOrgs),
      fetchSheetData(sheetUrls.safetyGuidelines)
    ]);

    console.log('Fetched data - Species:', speciesData?.length, 'Rescue Orgs:', rescueOrgsData?.length, 'Safety Guidelines:', safetyData?.length);

    // Create system prompt with your data
    const systemPrompt = `You are WildAware AI, an expert wildlife safety assistant. You have access to comprehensive databases about Indian wildlife, rescue organizations, and safety protocols.

AVAILABLE DATA:
- ${speciesData?.length || 0} species records with behavior, risk levels, and safety information
- ${rescueOrgsData?.length || 0} rescue organizations across India with contact details
- ${safetyData?.length || 0} situation-specific safety guidelines

SPECIES DATABASE:
${speciesData?.slice(0, 20).map((s: any) => `- ${s.common_name || s.name} (${s.scientific_name || 'N/A'}): Risk Level: ${s.risk_level || 'N/A'}, Category: ${s.category || 'N/A'}`).join('\n') || 'No species data available'}

RESCUE ORGANIZATIONS (Sample):
${rescueOrgsData?.slice(0, 10).map((org: any) => `- ${org.name || org.organization_name} (${org.state}, ${org.district || org.city}): Phone: ${org.phone || org.contact_number}, WhatsApp: ${org.whatsapp || 'N/A'}, Species: ${org.species_supported || 'General'}`).join('\n') || 'No rescue org data available'}

SAFETY GUIDELINES:
${safetyData?.slice(0, 10).map((sg: any) => `- ${sg.situation || sg.scenario}: DO: ${sg.dos || sg.do || 'N/A'} | DON'T: ${sg.donts || sg.dont || 'N/A'}`).join('\n') || 'No safety guidelines available'}

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
    const speciesGuess = speciesData?.find((s: any) => 
      message.toLowerCase().includes((s.common_name || s.name || '').toLowerCase()) ||
      (s.scientific_name && message.toLowerCase().includes(s.scientific_name.toLowerCase()))
    )?.common_name || speciesData?.find((s: any) => 
      message.toLowerCase().includes((s.name || '').toLowerCase())
    )?.name || 'unknown';

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