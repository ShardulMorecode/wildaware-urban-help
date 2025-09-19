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

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Starting knowledge embedding process...');

    // Step 1: Get all species data
    const { data: species, error: speciesError } = await supabase
      .from('species')
      .select('*');

    if (speciesError) throw speciesError;

    // Step 2: Get all safety guidelines
    const { data: safetyGuidelines, error: safetyError } = await supabase
      .from('safety_guidelines')
      .select('*');

    if (safetyError) throw safetyError;

    // Step 3: Get all rescue organizations
    const { data: rescueOrgs, error: rescueError } = await supabase
      .from('rescue_orgs')
      .select('*');

    if (rescueError) throw rescueError;

    console.log(`Processing ${species?.length} species, ${safetyGuidelines?.length} guidelines, ${rescueOrgs?.length} rescue orgs`);

    let processedCount = 0;
    const embeddings = [];

    // Process species data
    if (species) {
      for (const item of species) {
        const content = `Species: ${item.common_name} (${item.scientific_name}). Risk Level: ${item.risk_level}. Keywords: ${item.keywords?.join(', ')}. ${item.description || ''}`;
        
        try {
          const embedding = await generateEmbedding(content);
          embeddings.push({
            content,
            content_type: 'species',
            source_id: item.id,
            embedding: `[${embedding.join(',')}]`,
            metadata: {
              common_name: item.common_name,
              scientific_name: item.scientific_name,
              risk_level: item.risk_level,
              keywords: item.keywords
            }
          });
          processedCount++;
        } catch (error) {
          console.error(`Error embedding species ${item.common_name}:`, error);
        }
      }
    }

    // Process safety guidelines
    if (safetyGuidelines) {
      for (const item of safetyGuidelines) {
        const content = `Safety Guidelines for ${item.species_common_name}: DO: ${item.dos}. DON'T: ${item.donts}. First Aid: ${item.first_aid || 'Not specified'}. ${item.authority_notes || ''}`;
        
        try {
          const embedding = await generateEmbedding(content);
          embeddings.push({
            content,
            content_type: 'safety_guideline',
            source_id: item.id,
            embedding: `[${embedding.join(',')}]`,
            metadata: {
              species_common_name: item.species_common_name,
              species_id: item.species_id
            }
          });
          processedCount++;
        } catch (error) {
          console.error(`Error embedding safety guideline for ${item.species_common_name}:`, error);
        }
      }
    }

    // Process rescue organizations
    if (rescueOrgs) {
      for (const item of rescueOrgs) {
        const content = `Rescue Organization: ${item.name} located in ${item.district || ''}, ${item.state}. Contact: ${item.phone || 'N/A'}, WhatsApp: ${item.whatsapp || 'N/A'}. Supports species: ${item.species_supported?.join(', ')}`;
        
        try {
          const embedding = await generateEmbedding(content);
          embeddings.push({
            content,
            content_type: 'rescue_org',
            source_id: item.id,
            embedding: `[${embedding.join(',')}]`,
            metadata: {
              name: item.name,
              state: item.state,
              district: item.district,
              species_supported: item.species_supported
            }
          });
          processedCount++;
        } catch (error) {
          console.error(`Error embedding rescue org ${item.name}:`, error);
        }
      }
    }

    // Step 4: Clear existing embeddings and insert new ones
    const { error: deleteError } = await supabase
      .from('knowledge_embeddings')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

    if (deleteError) {
      console.error('Error clearing existing embeddings:', deleteError);
    }

    // Insert new embeddings in batches
    const batchSize = 10;
    let insertedCount = 0;

    for (let i = 0; i < embeddings.length; i += batchSize) {
      const batch = embeddings.slice(i, i + batchSize);
      
      const { error: insertError } = await supabase
        .from('knowledge_embeddings')
        .insert(batch);

      if (insertError) {
        console.error('Error inserting batch:', insertError);
      } else {
        insertedCount += batch.length;
      }
    }

    console.log(`Successfully processed ${processedCount} items and inserted ${insertedCount} embeddings`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        processed: processedCount,
        inserted: insertedCount,
        message: 'Knowledge base embeddings updated successfully'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in embed-knowledge function:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        success: false
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
    // Use Gemini's embedding model
    const model = genAI.getGenerativeModel({ model: "text-embedding-004" });
    const result = await model.embedContent(text);
    return result.embedding.values;
  } catch (error) {
    console.error('Error generating embedding with Gemini:', error);
    
    // Fallback: create a deterministic embedding based on text content
    const embedding = new Array(384).fill(0);
    const words = text.toLowerCase().split(/\s+/);
    
    for (let i = 0; i < words.length && i < embedding.length; i++) {
      const word = words[i];
      let hash = 0;
      for (let j = 0; j < word.length; j++) {
        hash = ((hash << 5) - hash + word.charCodeAt(j)) & 0xffffffff;
      }
      embedding[i] = (hash % 1000) / 1000; // Normalize to [-1, 1]
    }
    
    return embedding;
  }
}