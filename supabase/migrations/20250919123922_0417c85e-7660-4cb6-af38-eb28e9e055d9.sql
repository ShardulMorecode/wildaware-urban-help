-- Create vector embeddings table for RAG
CREATE EXTENSION IF NOT EXISTS vector;

-- Table to store vector embeddings for wildlife knowledge
CREATE TABLE IF NOT EXISTS public.knowledge_embeddings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  content TEXT NOT NULL,
  content_type TEXT NOT NULL, -- 'species', 'safety_guideline', 'rescue_org'
  source_id UUID NOT NULL,
  embedding vector(384), -- Using all-MiniLM-L6-v2 384-dimensional embeddings
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.knowledge_embeddings ENABLE ROW LEVEL SECURITY;

-- Create policy for public read access (since this is knowledge data)
CREATE POLICY "Allow public read access to knowledge embeddings" 
ON public.knowledge_embeddings 
FOR SELECT 
USING (true);

-- Create index for vector similarity search
CREATE INDEX IF NOT EXISTS knowledge_embeddings_embedding_idx 
ON public.knowledge_embeddings 
USING ivfflat (embedding vector_cosine_ops) 
WITH (lists = 100);

-- Create index for content type filtering
CREATE INDEX IF NOT EXISTS knowledge_embeddings_content_type_idx 
ON public.knowledge_embeddings (content_type);

-- Create index for source_id lookup
CREATE INDEX IF NOT EXISTS knowledge_embeddings_source_id_idx 
ON public.knowledge_embeddings (source_id);