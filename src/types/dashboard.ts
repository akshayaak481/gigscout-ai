export type DashboardTab =
  | 'scout'
  | 'opportunities'
  | 'saved'
  | 'mission_control'
  | 'knowledge_base'
  | 'profile'
  | 'settings';

export interface RAGChunk {
  id: string;
  profileId?: string;
  documentName?: string;
  documentUrl?: string;
  chunkIndex?: number;
  chunkTitle?: string;
  title: string;
  content?: string;
  description: string;
  similarityScore: number; // e.g. 0.94
  isUsedEvidence?: boolean;
  usedReason?: string;
  technologies?: string[];
  metadata?: Record<string, any>;
  createdAt?: string;
}

export interface MatchScoreCategory {
  category: string;
  score: number;
  maxScore: number;
  color?: string;
}

export interface MatchScoreBreakdown {
  overallPercentage: number;
  categories: MatchScoreCategory[];
  totalScore: number;
  maxTotalScore: number;
}

export interface WorkflowNode {
  id: string;
  title: string;
  subtitle: string;
  type: 'request' | 'agent' | 'parallel' | 'output';
  status: 'idle' | 'running' | 'completed' | 'warning';
  activeDetails?: string;
}

export interface StepLogItem {
  id: string;
  agentName: string;
  action: string;
  timestamp: string;
  status: 'completed' | 'running' | 'warning' | 'idle';
  isSummary?: boolean;
  summaryMetrics?: string;
}

export type RAGIngestionStep =
  | 'idle'
  | 'uploading'
  | 'extracting'
  | 'chunking'
  | 'embedding'
  | 'storing'
  | 'completed'
  | 'error';

export interface RAGIngestionStatus {
  step: RAGIngestionStep;
  progressPercentage: number;
  message: string;
  extractedLength?: number;
  chunksCount?: number;
  tokensUsed?: number;
  error?: string | null;
}
