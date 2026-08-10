import { Opportunity } from './opportunity';
import { FreelancerProfile, PitchDraft } from './profile';

export type AgentNodeId =
  | 'supervisor'
  | 'discovery_agent'
  | 'rag_agent'
  | 'risk_agent'
  | 'ranking_agent'
  | 'pitch_agent';

export type AgentNodeStatus = 'idle' | 'running' | 'completed' | 'warning' | 'failed';

export interface AgentNodeMetadata {
  id: AgentNodeId;
  name: string;
  role: string;
  icon: string;
  description: string;
  status: AgentNodeStatus;
  executionTimeMs?: number;
  tokensUsed?: number;
  itemsProcessed?: number;
  activeMessage?: string;
}

export interface AgentLogEntry {
  id: string;
  timestamp: string;
  agentId: AgentNodeId;
  level: 'info' | 'success' | 'warn' | 'error' | 'agent_action';
  message: string;
  details?: Record<string, unknown> | string;
  traceId?: string;
  latencyMs?: number;
}

export interface LLMCallTelemetry {
  id: string;
  traceId: string;
  model: string;
  provider: 'OpenAI' | 'Anthropic' | 'LangChain';
  purpose: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  latencyMs: number;
  status: 'success' | 'failed';
  error?: string;
  timestamp: string;
}

export interface ToolCallTelemetry {
  id: string;
  traceId: string;
  toolName: 'tavily_search_opportunities' | 'supabase_pgvector_search' | 'supabase_profile_sync' | 'risk_sentinel_screen';
  target: string;
  inputSummary: string;
  outputSummary: string;
  latencyMs: number;
  status: 'success' | 'warning' | 'failed';
  error?: string;
  timestamp: string;
}

export interface TraceRun {
  id: string;
  traceId: string;
  name: string;
  runType: 'chain' | 'llm' | 'tool' | 'agent_workflow';
  status: 'running' | 'completed' | 'failed' | 'warning';
  startTime: string;
  endTime?: string;
  latencyMs: number;
  totalTokens?: number;
  promptTokens?: number;
  completionTokens?: number;
  estimatedCost?: string;
  llmCalls: LLMCallTelemetry[];
  toolCalls: ToolCallTelemetry[];
  error?: string | null;
  tags: string[];
  metadata?: Record<string, any>;
}

export interface ObservabilitySummary {
  totalRuns: number;
  totalLLMCalls: number;
  totalToolCalls: number;
  avgLatencyMs: number;
  totalTokens: number;
  activeProject: string;
  langsmithEndpoint: string;
  langsmithConnected: boolean;
  errorRatePercentage: number;
}

export interface AgentGraphState {
  runId: string;
  traceId?: string;
  userPrompt: string;
  profile: FreelancerProfile;
  discoveredOpportunities: Opportunity[];
  analyzedOpportunities: Opportunity[];
  rankedOpportunities: Opportunity[];
  generatedPitches: Record<string, PitchDraft>;
  activeNode: AgentNodeId | null;
  overallStatus: 'idle' | 'running' | 'completed' | 'failed';
  logs: AgentLogEntry[];
  startTime?: string;
  endTime?: string;
  totalTokens?: number;
  totalLatencyMs?: number;
  traceRun?: TraceRun;
}
