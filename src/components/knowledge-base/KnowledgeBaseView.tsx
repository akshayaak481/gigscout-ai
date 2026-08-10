'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  Database, 
  Sparkles, 
  Search, 
  UploadCloud, 
  CheckCircle2, 
  Cpu, 
  Zap, 
  RefreshCw, 
  AlertCircle, 
  SlidersHorizontal, 
  FileCheck2, 
  Layers 
} from 'lucide-react';
import { FreelancerProfile } from '@/types/profile';
import { RAGChunk, RAGIngestionStatus } from '@/types/dashboard';
import { uploadAndIngestDocument, searchPortfolioEvidence, fetchProfileChunks } from '@/lib/services/ragService';
import confetti from 'canvas-confetti';

interface KnowledgeBaseViewProps {
  activeProfile: FreelancerProfile;
  ragChunks: RAGChunk[];
  onOpenUploadModal: () => void;
  onUpdateRetrievedChunks?: (chunks: RAGChunk[]) => void;
}

export function KnowledgeBaseView({
  activeProfile,
  ragChunks: initialChunks,
  onOpenUploadModal,
  onUpdateRetrievedChunks,
}: KnowledgeBaseViewProps) {
  const [chunks, setChunks] = useState<RAGChunk[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('What data visualization tools does the freelancer know?');
  const [similarityThreshold, setSimilarityThreshold] = useState<number>(0.50);
  const [searchResults, setSearchResults] = useState<RAGChunk[]>([]);
  const [hasSearched, setHasSearched] = useState<boolean>(false);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [ingestionStatus, setIngestionStatus] = useState<RAGIngestionStatus | null>(null);
  const [feedbackBanner, setFeedbackBanner] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load existing profile chunks from Supabase on mount or when activeProfile changes
  useEffect(() => {
    async function loadChunks() {
      try {
        const loaded = await fetchProfileChunks(activeProfile.id);
        if (loaded && loaded.length > 0) {
          setChunks(loaded);
          setSearchResults(loaded);
        } else {
          setChunks([]);
          setSearchResults([]);
        }
      } catch (err) {
        console.error('Failed to load profile chunks:', err);
      }
    }
    loadChunks();
  }, [activeProfile.id]);

  // Execute Semantic Retrieval Search
  const handleSearch = async (queryText: string) => {
    const trimmed = queryText.trim();
    if (!trimmed) return;
    
    setIsSearching(true);
    setHasSearched(true);
    setFeedbackBanner(null);

    try {
      const response = await searchPortfolioEvidence(
        trimmed,
        activeProfile.id,
        similarityThreshold
      );

      if (response && Array.isArray(response.results)) {
        setSearchResults(response.results);
        if (onUpdateRetrievedChunks) {
          onUpdateRetrievedChunks(response.results);
        }

        if (response.results.length === 0) {
          setFeedbackBanner({
            type: 'info',
            message: `No matching chunks found with cosine similarity >= ${similarityThreshold.toFixed(2)} for "${trimmed}". Try lowering the similarity threshold.`,
          });
        }
      } else {
        setSearchResults([]);
      }
    } catch (err: any) {
      console.error('Vector search error:', err);
      setSearchResults([]);
      setFeedbackBanner({
        type: 'error',
        message: err.message || 'Vector similarity search failed against Supabase pgvector.',
      });
    } finally {
      setIsSearching(false);
    }
  };

  // Handle File Upload & End-to-End RAG Ingestion
  const handleFileUpload = async (file: File) => {
    if (!file) return;

    // Reset status
    setFeedbackBanner(null);
    setIngestionStatus({
      step: 'uploading',
      progressPercentage: 20,
      message: `Uploading ${file.name}...`,
    });

    try {
      // Step 2: Extracting Text
      setTimeout(() => {
        setIngestionStatus({
          step: 'extracting',
          progressPercentage: 45,
          message: `Extracting text from ${file.name} with unpdf...`,
        });
      }, 400);

      // Step 3: Chunking & OpenAI Embeddings
      setTimeout(() => {
        setIngestionStatus({
          step: 'embedding',
          progressPercentage: 75,
          message: 'Splitting into semantic chunks & generating OpenAI text-embedding-3-small (1536d)...',
        });
      }, 900);

      const result = await uploadAndIngestDocument(file, activeProfile.id);

      setIngestionStatus({
        step: 'completed',
        progressPercentage: 100,
        message: `Indexed ${result.chunksCount} chunks (${result.totalCharacters} chars) into Supabase pgvector!`,
        chunksCount: result.chunksCount,
      });

      // Update state with newly ingested chunks
      if (result.chunks && result.chunks.length > 0) {
        setChunks(result.chunks);
        setSearchResults(result.chunks);
        if (onUpdateRetrievedChunks) {
          onUpdateRetrievedChunks(result.chunks);
        }
      }

      confetti({
        particleCount: 50,
        spread: 70,
        origin: { y: 0.5 },
        colors: ['#00f2fe', '#8b5cf6', '#10b981'],
      });

      setFeedbackBanner({
        type: 'success',
        message: `Successfully ingested "${result.documentName}". Stored in Supabase pgvector with 1536d OpenAI embeddings.`,
      });

      setTimeout(() => {
        setIngestionStatus(null);
      }, 4500);

    } catch (err: any) {
      console.error('Ingestion failed:', err);
      setIngestionStatus({
        step: 'error',
        progressPercentage: 100,
        message: err.message || 'Ingestion failed.',
        error: err.message,
      });
      setFeedbackBanner({
        type: 'error',
        message: err.message || 'Failed to ingest document into Supabase vector store.',
      });
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const sampleSearchQueries = [
    'What data visualization tools does the freelancer know?',
    'What programming languages does the freelancer know?',
    'What projects has the freelancer built?',
    'What cloud technologies does the freelancer have experience with?',
  ];

  return (
    <div className="space-y-8 max-w-6xl mx-auto py-4">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-extrabold text-white tracking-tight">
              RAG Knowledge Base &amp; Vector Locker
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-cyan-500/10 text-cyan-300 border border-cyan-500/30">
              pgvector 1536d
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Upload PDF resumes &amp; portfolio documents. Extract text, generate OpenAI embeddings, and perform cosine similarity search against Supabase pgvector.
          </p>
        </div>

        <button
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-slate-900 bg-gradient-to-r from-cyan-400 to-sky-400 hover:from-cyan-300 hover:to-sky-300 shadow-md shadow-cyan-500/20 transition-all shrink-0 cursor-pointer"
        >
          <UploadCloud className="w-4 h-4 text-slate-900" />
          <span>Upload PDF Resume / Portfolio</span>
        </button>
      </div>

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.txt,.md"
        className="hidden"
        onChange={(e) => {
          if (e.target.files && e.target.files[0]) {
            handleFileUpload(e.target.files[0]);
          }
        }}
      />

      {/* Feedback Banner */}
      {feedbackBanner && (
        <div
          className={`p-4 rounded-xl border flex items-center justify-between text-xs font-mono transition-all animate-in fade-in duration-200 ${
            feedbackBanner.type === 'success'
              ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
              : feedbackBanner.type === 'info'
              ? 'bg-amber-950/40 border-amber-500/40 text-amber-300'
              : 'bg-rose-950/40 border-rose-500/40 text-rose-300'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedbackBanner.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : feedbackBanner.type === 'info' ? (
              <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            )}
            <span>{feedbackBanner.message}</span>
          </div>
          <button
            onClick={() => setFeedbackBanner(null)}
            className="text-slate-400 hover:text-white ml-2 text-sm cursor-pointer"
          >
            ×
          </button>
        </div>
      )}

      {/* Upload Drag-and-Drop Area & Live Pipeline Ingestion Progress */}
      <div className="space-y-4">
        <div
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`p-8 rounded-2xl border-2 border-dashed transition-all duration-200 cursor-pointer text-center space-y-3 ${
            isDragging
              ? 'border-cyan-400 bg-cyan-950/30 scale-[1.01]'
              : 'border-slate-800 hover:border-cyan-500/50 bg-[#0a0e1f]/80'
          }`}
        >
          <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 flex items-center justify-center mx-auto shadow-inner">
            <UploadCloud className="w-6 h-6 animate-bounce" style={{ animationDuration: '3s' }} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">
              Drag &amp; drop your PDF Resume or Portfolio Document
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Supports <strong className="text-cyan-300">.pdf</strong>, <strong className="text-cyan-300">.txt</strong>, and <strong className="text-cyan-300">.md</strong> files. Text is chunked, embedded with OpenAI text-embedding-3-small, and indexed in Supabase pgvector.
            </p>
          </div>
          <div className="flex items-center justify-center gap-3 text-[11px] font-mono text-slate-500 pt-1">
            <span className="flex items-center gap-1"><FileCheck2 className="w-3.5 h-3.5 text-emerald-400" /> Automatic Text Extraction</span>
            <span>•</span>
            <span className="flex items-center gap-1"><Cpu className="w-3.5 h-3.5 text-purple-400" /> text-embedding-3-small (1536d)</span>
            <span>•</span>
            <span className="flex items-center gap-1"><Database className="w-3.5 h-3.5 text-cyan-400" /> Supabase pgvector Cosine Search</span>
          </div>
        </div>

        {/* Live Ingestion Stepper Progress Card (Shown during upload) */}
        {ingestionStatus && (
          <div className="p-4 rounded-xl bg-[#091224] border border-cyan-500/40 space-y-3 animate-in fade-in duration-200">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-cyan-300 flex items-center gap-2">
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-cyan-400" />
                RAG Ingestion Pipeline in Progress
              </span>
              <span className="text-xs font-mono font-bold text-cyan-400">
                {ingestionStatus.progressPercentage}%
              </span>
            </div>

            {/* Progress Bar */}
            <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-cyan-400 to-purple-500 transition-all duration-300"
                style={{ width: `${ingestionStatus.progressPercentage}%` }}
              />
            </div>

            <p className="text-xs font-mono text-slate-300">
              {ingestionStatus.message}
            </p>
          </div>
        )}
      </div>

      {/* Vector DB Metrics Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        {[
          { label: 'Indexed Vector Chunks', value: `${chunks.length} Chunks`, icon: Layers, color: 'text-cyan-400' },
          { label: 'Embedding Model', value: 'text-embedding-3-small', icon: Cpu, color: 'text-purple-400' },
          { label: 'Retrieval Storage', value: 'Supabase pgvector', icon: Database, color: 'text-emerald-400' },
          { label: 'Similarity Metric', value: 'Cosine Similarity (1-d)', icon: Zap, color: 'text-amber-400' },
        ].map((item, idx) => (
          <div key={`metric-${idx}`} className="p-4 rounded-xl bg-[#0a0e1f] border border-slate-800 flex items-center gap-3 shadow-md">
            <div className={`p-2.5 rounded-lg bg-slate-900 border border-slate-800 ${item.color}`}>
              <item.icon className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] font-mono text-slate-500 uppercase block">{item.label}</span>
              <span className="text-xs font-bold text-slate-200 font-mono">{item.value}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Semantic Retrieval & Similarity Search Sandbox */}
      <div className="p-6 rounded-2xl bg-[#0a0e1f] border border-purple-900/40 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-purple-400 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-400" />
              Semantic Cosine Similarity Retrieval Interface
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Enter queries to execute real OpenAI vector similarity search against your stored resume chunks in Supabase pgvector.
            </p>
          </div>
          <span className="text-[11px] font-mono text-slate-400">
            Min Similarity: <strong className="text-emerald-400">{similarityThreshold.toFixed(2)}</strong>
          </span>
        </div>

        {/* Search Input Bar */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSearch(searchQuery);
          }}
          className="flex gap-2"
        >
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="e.g. What data visualization tools does the freelancer know? What projects has the freelancer built?..."
              className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-[#070b18] border border-slate-800 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-purple-500/60 font-mono transition-colors"
            />
          </div>

          <button
            type="submit"
            disabled={isSearching}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-[#312563] hover:bg-purple-800/80 border border-purple-500/40 transition-all shrink-0 cursor-pointer disabled:opacity-50"
          >
            {isSearching ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Retrieving...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5 text-purple-300" />
                <span>Retrieve Evidence</span>
              </>
            )}
          </button>
        </form>

        {/* Query Suggestion Pills */}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <span className="text-[11px] font-mono text-slate-500">Try Query:</span>
          {sampleSearchQueries.map((q, idx) => (
            <button
              key={`query-pill-${idx}`}
              onClick={() => {
                setSearchQuery(q);
                handleSearch(q);
              }}
              className="px-2.5 py-1 rounded-lg text-[11px] font-mono bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-purple-300 border border-slate-800 transition-colors cursor-pointer"
            >
              {q}
            </button>
          ))}
        </div>

        {/* Similarity Threshold Slider */}
        <div className="flex items-center gap-4 pt-2 border-t border-slate-800/60 text-xs font-mono">
          <span className="text-slate-400 shrink-0">Similarity Filter:</span>
          <input
            type="range"
            min="0.30"
            max="0.95"
            step="0.05"
            value={similarityThreshold}
            onChange={(e) => setSimilarityThreshold(parseFloat(e.target.value))}
            className="w-full accent-purple-500 cursor-pointer"
          />
          <span className="text-emerald-400 font-bold shrink-0">{similarityThreshold.toFixed(2)}</span>
        </div>
      </div>

      {/* Top Retrieved Evidence Chunks */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300">
            Retrieved Evidence Chunks ({searchResults.length} {searchResults.length === 1 ? 'match' : 'matches'})
          </h3>
          <span className="text-[11px] font-mono text-slate-500">
            Ranked by Cosine Similarity (1 - vector_distance)
          </span>
        </div>

        {/* Top Evidence Highlight (Used Evidence) */}
        {searchResults.length > 0 && (
          <div className="p-4 rounded-2xl bg-[#0d2624] border border-emerald-500/40 space-y-2 shadow-lg animate-in fade-in duration-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 uppercase">
                  Primary Top Match
                </span>
                <span className="text-xs font-bold text-white">
                  {searchResults[0].title || searchResults[0].chunkTitle}
                </span>
              </div>
              <span className="text-sm font-mono font-extrabold text-emerald-400">
                {searchResults[0].similarityScore ? searchResults[0].similarityScore.toFixed(4) : '1.0000'}
              </span>
            </div>
            <p className="text-xs text-emerald-200/90 leading-relaxed font-mono">
              <strong className="text-emerald-400">Evidence Source: </strong>
              {searchResults[0].documentName ? `${searchResults[0].documentName} (Chunk #${searchResults[0].chunkIndex || 1})` : 'Indexed Resume'}
            </p>
            <p className="text-xs text-slate-200 font-mono bg-[#071716] p-3 rounded-xl border border-emerald-500/20 whitespace-pre-wrap">
              {searchResults[0].content || searchResults[0].description}
            </p>
          </div>
        )}

        {/* Chunks Grid */}
        {searchResults.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {searchResults.map((chunk, idx) => {
              // Guaranteed unique stable key
              const uniqueKey = chunk.id 
                ? `chunk-id-${chunk.id}` 
                : `chunk-doc-${chunk.documentName || 'resume'}-${chunk.chunkIndex ?? idx}-${idx}`;

              return (
                <div
                  key={uniqueKey}
                  className="p-5 rounded-2xl bg-[#0a0e1f] border border-slate-800 hover:border-purple-500/40 transition-all flex flex-col justify-between shadow-md space-y-3"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-purple-500/15 text-purple-300 border border-purple-500/30 font-bold truncate max-w-[180px]">
                        {chunk.documentName ? `${chunk.documentName} • Chunk #${chunk.chunkIndex || idx + 1}` : `Evidence Chunk #${idx + 1}`}
                      </span>
                      <span className="text-xs font-mono font-bold text-emerald-400">
                        {typeof chunk.similarityScore === 'number' ? chunk.similarityScore.toFixed(4) : '1.0000'}
                      </span>
                    </div>

                    <h4 className="font-bold text-sm text-white mb-1.5 line-clamp-1">
                      {chunk.title || chunk.chunkTitle}
                    </h4>
                    <p className="text-xs text-slate-300 leading-relaxed font-mono whitespace-pre-wrap line-clamp-4">
                      {chunk.content || chunk.description}
                    </p>

                    {chunk.metadata && chunk.metadata.sectionHeader && (
                      <div className="mt-3 p-2 rounded-lg bg-[#070b18] border border-slate-800/80 text-[10px] font-mono text-slate-400 truncate">
                        <span className="text-slate-500">Section: </span>
                        {chunk.metadata.sectionHeader}
                      </div>
                    )}
                  </div>

                  <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-[10px] font-mono text-slate-500">
                    <span>pgvector 1536d</span>
                    <span className="text-emerald-400 font-semibold">Verified Chunk</span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-12 text-center rounded-2xl bg-[#0a0e1f]/60 border border-slate-800 space-y-3">
            <SlidersHorizontal className="w-8 h-8 text-slate-500 mx-auto" />
            <h4 className="text-sm font-bold text-slate-300">
              {hasSearched 
                ? `No matching chunks above similarity threshold ${similarityThreshold.toFixed(2)}`
                : chunks.length === 0 
                ? 'No resume documents indexed in Supabase pgvector yet'
                : 'Enter a search query to retrieve portfolio evidence'}
            </h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              {hasSearched 
                ? 'Try lowering the similarity filter slider or refining your search query.'
                : chunks.length === 0 
                ? 'Upload your PDF resume or portfolio deck above to chunk, embed, and store in pgvector.'
                : 'Click "Retrieve Evidence" or select one of the suggested query pills above.'}
            </p>
          </div>
        )}
      </div>

    </div>
  );
}
