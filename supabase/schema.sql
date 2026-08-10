-- ==============================================================================
-- GigScout AI — Supabase Database Schema (pgvector & Saved Opportunities)
-- ==============================================================================

-- 1. Enable pgvector extension for semantic RAG search
CREATE EXTENSION IF NOT EXISTS vector;

-- 2. Create profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    title TEXT NOT NULL,
    target_role TEXT NOT NULL,
    bio TEXT,
    skills JSONB NOT NULL DEFAULT '[]'::jsonb,
    hourly_rate_min NUMERIC DEFAULT 0,
    hourly_rate_max NUMERIC DEFAULT 0,
    currency TEXT DEFAULT 'INR',
    availability_hours_per_week INT DEFAULT 10,
    location_preference TEXT DEFAULT 'Remote',
    project_duration TEXT DEFAULT '1 - 2 weeks',
    portfolio_items JSONB NOT NULL DEFAULT '[]'::jsonb,
    raw_resume_text TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Create portfolio_embeddings table for RAG knowledge chunks
CREATE TABLE IF NOT EXISTS public.portfolio_embeddings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id TEXT NOT NULL,
    document_name TEXT NOT NULL,
    document_url TEXT,
    chunk_index INT NOT NULL,
    chunk_title TEXT,
    content TEXT NOT NULL,
    token_count INT,
    metadata JSONB DEFAULT '{}'::jsonb,
    embedding VECTOR(1536) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Create saved_opportunities table for shortlisted gigs
CREATE TABLE IF NOT EXISTS public.saved_opportunities (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    profile_id TEXT NOT NULL,
    opportunity_id TEXT NOT NULL,
    opportunity_data JSONB NOT NULL,
    saved_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(profile_id, opportunity_id)
);

-- 5. Create indexes
CREATE INDEX IF NOT EXISTS idx_portfolio_embeddings_vector 
    ON public.portfolio_embeddings 
    USING hnsw (embedding vector_cosine_ops);

CREATE INDEX IF NOT EXISTS idx_portfolio_embeddings_profile_id 
    ON public.portfolio_embeddings (profile_id);

CREATE INDEX IF NOT EXISTS idx_portfolio_embeddings_doc_name 
    ON public.portfolio_embeddings (document_name);

CREATE INDEX IF NOT EXISTS idx_profiles_updated_at 
    ON public.profiles (updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_saved_opportunities_profile_id 
    ON public.saved_opportunities (profile_id);

CREATE INDEX IF NOT EXISTS idx_saved_opportunities_opp_id 
    ON public.saved_opportunities (opportunity_id);

-- 6. Enable Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.portfolio_embeddings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_opportunities ENABLE ROW LEVEL SECURITY;

-- 7. Role Permissions (GRANT)
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.profiles TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.portfolio_embeddings TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.saved_opportunities TO anon, authenticated, service_role;

-- 8. Policies allowing read and write access for application workflows
DROP POLICY IF EXISTS "Allow public read access on profiles" ON public.profiles;
CREATE POLICY "Allow public read access on profiles"
    ON public.profiles FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow public insert/update access on profiles" ON public.profiles;
CREATE POLICY "Allow public insert/update access on profiles"
    ON public.profiles FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow read access on portfolio_embeddings" ON public.portfolio_embeddings;
DROP POLICY IF EXISTS "Allow public read access on portfolio_embeddings" ON public.portfolio_embeddings;
CREATE POLICY "Allow read access on portfolio_embeddings"
    ON public.portfolio_embeddings FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow privileged access on portfolio_embeddings" ON public.portfolio_embeddings;
DROP POLICY IF EXISTS "Allow public insert/update access on portfolio_embeddings" ON public.portfolio_embeddings;
DROP POLICY IF EXISTS "Allow public delete access on portfolio_embeddings" ON public.portfolio_embeddings;
CREATE POLICY "Allow privileged access on portfolio_embeddings"
    ON public.portfolio_embeddings FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public access on saved_opportunities" ON public.saved_opportunities;
CREATE POLICY "Allow public access on saved_opportunities"
    ON public.saved_opportunities FOR ALL USING (true) WITH CHECK (true);

-- 9. RPC Function for Cosine Similarity Vector Search
CREATE OR REPLACE FUNCTION match_portfolio_embeddings(
    query_embedding VECTOR(1536),
    match_threshold FLOAT DEFAULT 0.5,
    match_count INT DEFAULT 6,
    filter_profile_id TEXT DEFAULT NULL
)
RETURNS TABLE (
    id UUID,
    profile_id TEXT,
    document_name TEXT,
    document_url TEXT,
    chunk_index INT,
    chunk_title TEXT,
    content TEXT,
    metadata JSONB,
    similarity FLOAT,
    created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT
        p.id,
        p.profile_id,
        p.document_name,
        p.document_url,
        p.chunk_index,
        p.chunk_title,
        p.content,
        p.metadata,
        (1 - (p.embedding <=> query_embedding))::FLOAT AS similarity,
        p.created_at
    FROM public.portfolio_embeddings p
    WHERE 
        (filter_profile_id IS NULL OR p.profile_id = filter_profile_id)
        AND (1 - (p.embedding <=> query_embedding)) >= match_threshold
    ORDER BY p.embedding <=> query_embedding ASC
    LIMIT match_count;
END;
$$;

GRANT EXECUTE ON FUNCTION match_portfolio_embeddings TO anon, authenticated, service_role;
