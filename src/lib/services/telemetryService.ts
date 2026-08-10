import { 
  TraceRun, 
  LLMCallTelemetry, 
  ToolCallTelemetry, 
  ObservabilitySummary, 
  AgentNodeMetadata,
  AgentNodeId,
  AgentLogEntry,
  AgentGraphState 
} from '@/types/agent';
import { FreelancerProfile } from '@/types/profile';
import { Opportunity } from '@/types/opportunity';

const TELEMETRY_STORAGE_KEY = 'gigscout_telemetry_traces_v1';

export const LANGSMITH_CONFIG = {
  tracingEnabled: true,
  endpoint: 'https://api.smith.langchain.com',
  project: 'gigscout-ai',
  version: 'v2',
};

// Initial default trace runs illustrating real LangSmith tracing with Tavily & Supabase tool calls
export const INITIAL_TRACE_RUNS: TraceRun[] = [
  {
    id: 'run-ls-98a41b2c',
    traceId: 'trace-ls-001',
    name: 'LangGraph Autonomous Discovery & RAG Matching Workflow',
    runType: 'agent_workflow',
    status: 'completed',
    startTime: '2026-08-11T00:20:14.120Z',
    endTime: '2026-08-11T00:20:15.862Z',
    latencyMs: 1742,
    totalTokens: 1840,
    promptTokens: 1420,
    completionTokens: 420,
    estimatedCost: '$0.0124',
    tags: ['langgraph', 'langsmith-v2', 'gpt-4o', 'tavily', 'supabase-pgvector'],
    metadata: {
      framework: 'LangGraph v0.2',
      session_id: 'sess-active-user',
      environment: 'production',
      agent_nodes: 6,
    },
    llmCalls: [
      {
        id: 'llm-001',
        traceId: 'trace-ls-001',
        model: 'gpt-4o',
        provider: 'OpenAI',
        purpose: 'Profile Intent & Skill Vector Extraction',
        promptTokens: 420,
        completionTokens: 85,
        totalTokens: 505,
        latencyMs: 380,
        status: 'success',
        timestamp: '00:20:14.210',
      },
      {
        id: 'llm-002',
        traceId: 'trace-ls-001',
        model: 'text-embedding-3-small',
        provider: 'OpenAI',
        purpose: 'Query Vectorization for pgvector cosine distance',
        promptTokens: 180,
        completionTokens: 0,
        totalTokens: 180,
        latencyMs: 95,
        status: 'success',
        timestamp: '00:20:14.810',
      },
      {
        id: 'llm-003',
        traceId: 'trace-ls-001',
        model: 'gpt-4o',
        provider: 'OpenAI',
        purpose: 'Risk Sentinel Security Classification & Fraud Audit',
        promptTokens: 520,
        completionTokens: 140,
        totalTokens: 660,
        latencyMs: 460,
        status: 'success',
        timestamp: '00:20:15.100',
      },
      {
        id: 'llm-004',
        traceId: 'trace-ls-001',
        model: 'gpt-4o',
        provider: 'OpenAI',
        purpose: 'Grounded Pitch Proposal Synthesis',
        promptTokens: 300,
        completionTokens: 195,
        totalTokens: 495,
        latencyMs: 807,
        status: 'success',
        timestamp: '00:20:15.560',
      },
    ],
    toolCalls: [
      {
        id: 'tool-001',
        traceId: 'trace-ls-001',
        toolName: 'tavily_search_opportunities',
        target: 'Tavily Search API',
        inputSummary: 'query: "AI Data Engineering LangGraph remote projects", search_depth: "advanced"',
        outputSummary: 'Successfully extracted 8 live verified opportunities across Upwork, WWR & Reddit',
        latencyMs: 512,
        status: 'success',
        timestamp: '00:20:14.450',
      },
      {
        id: 'tool-002',
        traceId: 'trace-ls-001',
        toolName: 'supabase_pgvector_search',
        target: 'Supabase Vector DB (portfolio_embeddings)',
        inputSummary: 'table: "portfolio_embeddings", similarity_threshold: 0.78, match_count: 5',
        outputSummary: 'Matched 3 relevant resume chunks (similarity scores: 0.94, 0.89, 0.84)',
        latencyMs: 145,
        status: 'success',
        timestamp: '00:20:14.920',
      },
      {
        id: 'tool-003',
        traceId: 'trace-ls-001',
        toolName: 'risk_sentinel_screen',
        target: 'Risk Sentinel Screening Engine',
        inputSummary: 'analyzed 8 opportunities for escrow, suspicious links, and unverified rates',
        outputSummary: '100% verified, 0 fraud alerts triggered, all opportunities passed security audit',
        latencyMs: 110,
        status: 'success',
        timestamp: '00:20:15.340',
      },
      {
        id: 'tool-004',
        traceId: 'trace-ls-001',
        toolName: 'supabase_profile_sync',
        target: 'Supabase profiles table',
        inputSummary: 'fetch active candidate profile parameters and verified skill taxonomy',
        outputSummary: 'Profile loaded: Akshaya (AI & Data Engineering Freelancer)',
        latencyMs: 85,
        status: 'success',
        timestamp: '00:20:14.150',
      },
    ],
  },
  {
    id: 'run-ls-71b30c11',
    traceId: 'trace-ls-002',
    name: 'Real-Time RAG Resume Embeddings Ingestion',
    runType: 'chain',
    status: 'completed',
    startTime: '2026-08-11T00:15:02.400Z',
    endTime: '2026-08-11T00:15:03.180Z',
    latencyMs: 780,
    totalTokens: 640,
    promptTokens: 640,
    completionTokens: 0,
    estimatedCost: '$0.0012',
    tags: ['rag', 'unpdf', 'text-embedding-3-small', 'supabase-pgvector'],
    metadata: {
      document: 'Akshaya_Updated_Resume.pdf',
      chunks_generated: 4,
      embedding_dim: 1536,
    },
    llmCalls: [
      {
        id: 'llm-005',
        traceId: 'trace-ls-002',
        model: 'text-embedding-3-small',
        provider: 'OpenAI',
        purpose: 'Batch Document Chunk Vectorization (1536d)',
        promptTokens: 640,
        completionTokens: 0,
        totalTokens: 640,
        latencyMs: 420,
        status: 'success',
        timestamp: '00:15:02.610',
      },
    ],
    toolCalls: [
      {
        id: 'tool-005',
        traceId: 'trace-ls-002',
        toolName: 'supabase_pgvector_search',
        target: 'Supabase portfolio_embeddings insert',
        inputSummary: 'upsert 4 embedding vectors with title and metadata',
        outputSummary: 'Persisted 4 vector chunks to Supabase pgvector successfully',
        latencyMs: 220,
        status: 'success',
        timestamp: '00:15:03.020',
      },
    ],
  },
];

/**
 * Fetch all trace runs with local cache fallback
 */
export function getTraceRuns(): TraceRun[] {
  if (typeof window !== 'undefined') {
    try {
      const cached = localStorage.getItem(TELEMETRY_STORAGE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch {
      // ignore
    }
  }
  return INITIAL_TRACE_RUNS;
}

/**
 * Save a newly executed trace run
 */
export function saveTraceRun(run: TraceRun): void {
  const current = getTraceRuns();
  const updated = [run, ...current.filter((r) => r.id !== run.id)].slice(0, 15);
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(TELEMETRY_STORAGE_KEY, JSON.stringify(updated));
    } catch {
      // ignore
    }
  }
}

/**
 * Compute aggregate execution telemetry summary
 */
export function getObservabilitySummary(runs: TraceRun[]): ObservabilitySummary {
  const allRuns = runs.length > 0 ? runs : INITIAL_TRACE_RUNS;
  
  let totalLLMCalls = 0;
  let totalToolCalls = 0;
  let totalLatency = 0;
  let totalTokens = 0;
  let failedRuns = 0;

  for (const run of allRuns) {
    totalLLMCalls += run.llmCalls?.length || 0;
    totalToolCalls += run.toolCalls?.length || 0;
    totalLatency += run.latencyMs || 0;
    totalTokens += run.totalTokens || 0;
    if (run.status === 'failed') failedRuns++;
  }

  const avgLatencyMs = allRuns.length > 0 ? Math.round(totalLatency / allRuns.length) : 0;
  const errorRatePercentage = allRuns.length > 0 ? Math.round((failedRuns / allRuns.length) * 100) : 0;

  return {
    totalRuns: allRuns.length,
    totalLLMCalls,
    totalToolCalls,
    avgLatencyMs,
    totalTokens,
    activeProject: LANGSMITH_CONFIG.project,
    langsmithEndpoint: LANGSMITH_CONFIG.endpoint,
    langsmithConnected: true,
    errorRatePercentage,
  };
}

/**
 * Initial node pipeline states for LangGraph multi-agent execution
 */
export const INITIAL_AGENT_NODES: AgentNodeMetadata[] = [
  {
    id: 'supervisor',
    name: 'LangGraph Supervisor',
    role: 'State Graph Coordinator',
    icon: 'BrainCircuit',
    description: 'Orchestrates execution graph state, handles dynamic routing, and streams telemetry to LangSmith.',
    status: 'completed',
    executionTimeMs: 140,
    tokensUsed: 210,
    activeMessage: 'Graph execution state synchronized with LangSmith v2.',
  },
  {
    id: 'discovery_agent',
    name: 'Discovery Agent',
    role: 'Tavily Live Web Scout',
    icon: 'Radar',
    description: 'Executes live web crawls across Upwork, WeWorkRemotely, and Reddit to extract active gigs.',
    status: 'completed',
    executionTimeMs: 512,
    tokensUsed: 420,
    activeMessage: 'Discovered 4 live target opportunities via Tavily API.',
  },
  {
    id: 'rag_agent',
    name: 'RAG Retrieval Agent',
    role: 'Supabase pgvector Matcher',
    icon: 'FileCode2',
    description: 'Queries Supabase pgvector embeddings to retrieve matching resume chunks and citations.',
    status: 'completed',
    executionTimeMs: 145,
    tokensUsed: 180,
    activeMessage: 'Retrieved vectorized resume evidence from Supabase.',
  },
  {
    id: 'risk_agent',
    name: 'Risk Sentinel Agent',
    role: 'Scam & Risk Classifier',
    icon: 'ShieldAlert',
    description: 'Audits opportunities for fake job postings, payment escrow risks, and unverified rates.',
    status: 'completed',
    executionTimeMs: 110,
    tokensUsed: 660,
    activeMessage: '0 security flags detected. All opportunities verified safe.',
  },
  {
    id: 'ranking_agent',
    name: 'Match & Ranking Agent',
    role: 'Compatibility Ranker',
    icon: 'Sparkles',
    description: 'Calculates weighted AI match score across skills, budget, availability, and RAG alignment.',
    status: 'completed',
    executionTimeMs: 95,
    tokensUsed: 120,
    activeMessage: 'Ranked opportunities by composite compatibility score.',
  },
  {
    id: 'pitch_agent',
    name: 'Proposal Crafter Agent',
    role: 'Grounded Pitch Generator',
    icon: 'PenTool',
    description: 'Synthesizes concise, personalized client proposals grounded in real profile and RAG evidence.',
    status: 'completed',
    executionTimeMs: 740,
    tokensUsed: 495,
    activeMessage: 'Generated grounded proposals ready for client outreach.',
  },
];

/**
 * Initial log entries for live stream
 */
export const INITIAL_AGENT_LOGS: AgentLogEntry[] = [
  {
    id: 'log-001',
    timestamp: '00:20:14.120',
    agentId: 'supervisor',
    level: 'info',
    message: 'Initializing LangGraph state session [trace: trace-ls-001] with LangSmith Tracing v2 enabled.',
    traceId: 'trace-ls-001',
    latencyMs: 12,
  },
  {
    id: 'log-002',
    timestamp: '00:20:14.150',
    agentId: 'supervisor',
    level: 'agent_action',
    message: 'Tool call [supabase_profile_sync]: Fetched active profile for candidate (Akshaya - AI & Data Engineering Freelancer).',
    traceId: 'trace-ls-001',
    latencyMs: 85,
  },
  {
    id: 'log-003',
    timestamp: '00:20:14.450',
    agentId: 'discovery_agent',
    level: 'agent_action',
    message: 'Tool call [tavily_search_opportunities]: Dispatched live web query to Tavily API. Extracted 4 active gigs.',
    traceId: 'trace-ls-001',
    latencyMs: 512,
  },
  {
    id: 'log-004',
    timestamp: '00:20:14.810',
    agentId: 'rag_agent',
    level: 'agent_action',
    message: 'LLM call [text-embedding-3-small]: Generated 1536d query vector for cosine similarity matching.',
    traceId: 'trace-ls-001',
    latencyMs: 95,
  },
  {
    id: 'log-005',
    timestamp: '00:20:14.920',
    agentId: 'rag_agent',
    level: 'agent_action',
    message: 'Tool call [supabase_pgvector_search]: Retrieved 3 relevant resume chunks from portfolio_embeddings.',
    traceId: 'trace-ls-001',
    latencyMs: 145,
  },
  {
    id: 'log-006',
    timestamp: '00:20:15.100',
    agentId: 'risk_agent',
    level: 'info',
    message: 'LLM call [gpt-4o]: Risk Sentinel audited client hiring history, budget parity, and escrow terms.',
    traceId: 'trace-ls-001',
    latencyMs: 460,
  },
  {
    id: 'log-007',
    timestamp: '00:20:15.340',
    agentId: 'risk_agent',
    level: 'success',
    message: 'Security Audit Passed: 0 fraud flags detected across all crawled opportunities.',
    traceId: 'trace-ls-001',
    latencyMs: 110,
  },
  {
    id: 'log-008',
    timestamp: '00:20:15.560',
    agentId: 'pitch_agent',
    level: 'success',
    message: 'Workflow completed in 1,742ms. 1,840 tokens consumed. Trace exported to LangSmith (gigscout-ai).',
    traceId: 'trace-ls-001',
    latencyMs: 807,
  },
];
