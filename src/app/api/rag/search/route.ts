import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { supabaseServer, isServerSupabaseConfigured } from '@/lib/supabaseServer';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { 
      query = '', 
      profileId = null,
      matchThreshold = 0.35,
      matchCount = 6 
    } = body;

    const trimmedQuery = typeof query === 'string' ? query.trim() : '';

    if (!trimmedQuery) {
      return NextResponse.json(
        { error: 'Search query cannot be empty.' }, 
        { status: 400 }
      );
    }

    // 1. Verify OpenAI API configuration
    if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY.includes('placeholder')) {
      return NextResponse.json(
        { error: 'OpenAI API key is not configured. Please set OPENAI_API_KEY in .env.local.' },
        { status: 500 }
      );
    }

    // 2. Generate 1536-dimensional query embedding via OpenAI
    const embeddingModel = process.env.OPENAI_EMBEDDING_MODEL || 'text-embedding-3-small';
    let queryEmbedding: number[];
    try {
      const embeddingRes = await openai.embeddings.create({
        model: embeddingModel,
        input: trimmedQuery,
      });
      queryEmbedding = embeddingRes.data[0].embedding;
    } catch (err: any) {
      console.error('OpenAI query embedding error:', err);
      return NextResponse.json(
        { error: `Failed to generate query embedding: ${err.message}` },
        { status: 500 }
      );
    }

    // 3. Verify Supabase configuration
    if (!isServerSupabaseConfigured) {
      return NextResponse.json(
        { 
          error: 'Supabase is not configured. Please set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (or NEXT_PUBLIC_SUPABASE_ANON_KEY).' 
        },
        { status: 503 }
      );
    }

    // 4. Perform vector similarity search via Supabase pgvector RPC strictly filtered by profileId
    const parsedThreshold = typeof matchThreshold === 'number' ? matchThreshold : parseFloat(matchThreshold) || 0.35;
    const parsedCount = typeof matchCount === 'number' ? matchCount : parseInt(matchCount, 10) || 6;

    const { data: rpcData, error: rpcError } = await supabaseServer.rpc('match_portfolio_embeddings', {
      query_embedding: queryEmbedding,
      match_threshold: parsedThreshold,
      match_count: parsedCount,
      filter_profile_id: profileId || null,
    });

    // Handle Supabase RPC errors
    if (rpcError) {
      console.error('Supabase pgvector RPC error:', rpcError);
      return NextResponse.json(
        { 
          error: `Supabase vector search error: ${rpcError.message || 'RPC function match_portfolio_embeddings failed.'}. Please ensure supabase/schema.sql has been executed in the Supabase SQL editor.` 
        },
        { status: 500 }
      );
    }

    // 5. Map retrieved Supabase pgvector chunks strictly
    const rawResults = rpcData || [];
    
    // Strict threshold filtering and sorting by similarity
    const filteredResults = rawResults
      .filter((row: any) => typeof row.similarity === 'number' && row.similarity >= parsedThreshold)
      .sort((a: any, b: any) => b.similarity - a.similarity);

    const results = filteredResults.map((row: any, idx: number) => {
      const score = Number(row.similarity.toFixed(4));
      const chunkTitle = row.chunk_title || `${row.document_name} - Chunk ${row.chunk_index}`;
      
      return {
        id: row.id || `chunk-${row.chunk_index}-${idx}`,
        profileId: row.profile_id,
        documentName: row.document_name,
        documentUrl: row.document_url || '',
        chunkIndex: row.chunk_index,
        chunkTitle: chunkTitle,
        title: chunkTitle,
        content: row.content,
        description: row.content.length > 220 ? row.content.slice(0, 220) + '...' : row.content,
        similarityScore: score,
        isUsedEvidence: idx === 0,
        usedReason: `Cosine similarity match (${(score * 100).toFixed(1)}%) with query: "${trimmedQuery}"`,
        metadata: row.metadata || {},
        createdAt: row.created_at,
      };
    });

    return NextResponse.json({
      success: true,
      query: trimmedQuery,
      matchThreshold: parsedThreshold,
      totalMatches: results.length,
      results,
      source: 'supabase_pgvector',
    });

  } catch (error: any) {
    console.error('RAG Search Unexpected Error:', error);
    return NextResponse.json(
      { error: error.message || 'An unexpected error occurred during similarity search.' },
      { status: 500 }
    );
  }
}
