import { RAGChunk } from '@/types/dashboard';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

export async function uploadAndIngestDocument(
  file: File,
  profileId: string
): Promise<{
  success: boolean;
  documentName: string;
  chunksCount: number;
  totalCharacters: number;
  chunks: RAGChunk[];
  source: string;
  error?: string | null;
}> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('profileId', profileId);

  const response = await fetch('/api/rag/ingest', {
    method: 'POST',
    body: formData,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || `Ingestion failed with status ${response.status}`);
  }

  return data;
}

export async function searchPortfolioEvidence(
  query: string,
  profileId?: string,
  threshold: number = 0.6
): Promise<{
  success: boolean;
  query: string;
  totalMatches: number;
  results: RAGChunk[];
  source: string;
}> {
  const response = await fetch('/api/rag/search', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      query,
      profileId: profileId || undefined,
      matchThreshold: threshold,
      matchCount: 8,
    }),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || `Similarity search failed with status ${response.status}`);
  }

  return data;
}

export async function fetchProfileChunks(profileId?: string): Promise<RAGChunk[]> {
  if (!isSupabaseConfigured) {
    return [];
  }

  try {
    let query = supabase
      .from('portfolio_embeddings')
      .select('id, profile_id, document_name, document_url, chunk_index, chunk_title, content, metadata, created_at')
      .order('created_at', { ascending: false });

    if (profileId) {
      query = query.eq('profile_id', profileId);
    }

    const { data, error } = await query;

    if (error) {
      console.warn('Supabase fetch chunks error:', error.message);
      return [];
    }

    if (data && data.length > 0) {
      return data.map((row: any, idx: number) => ({
        id: row.id,
        profileId: row.profile_id,
        documentName: row.document_name,
        documentUrl: row.document_url,
        chunkIndex: row.chunk_index,
        chunkTitle: row.chunk_title || `${row.document_name} - Chunk ${row.chunk_index}`,
        title: row.chunk_title || `${row.document_name} - Chunk ${row.chunk_index}`,
        content: row.content,
        description: row.content.length > 200 ? row.content.slice(0, 200) + '...' : row.content,
        similarityScore: 1.0,
        isUsedEvidence: idx === 0,
        usedReason: `Stored resume chunk from ${row.document_name}`,
        metadata: row.metadata || {},
        createdAt: row.created_at,
      }));
    }
  } catch (e: any) {
    console.warn('Supabase fetch chunks exception:', e.message);
  }

  return [];
}
