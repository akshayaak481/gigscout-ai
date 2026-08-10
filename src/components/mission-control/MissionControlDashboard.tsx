'use client';

import React, { useState } from 'react';
import { 
  CheckCircle2, 
  FileText, 
  Briefcase, 
  Sparkles, 
  ShieldCheck, 
  ArrowDown, 
  Layers, 
  Check, 
  ExternalLink, 
  ChevronRight, 
  TrendingUp, 
  Cpu,
  Activity,
  Terminal,
  Play,
  RefreshCw,
  Zap,
  Radar,
  FileCode2,
  ShieldAlert,
  PenTool,
  BrainCircuit
} from 'lucide-react';
import { Opportunity } from '@/types/opportunity';
import { FreelancerProfile } from '@/types/profile';
import { RAGChunk, MatchScoreBreakdown, StepLogItem } from '@/types/dashboard';
import { 
  TraceRun, 
  ObservabilitySummary, 
  AgentLogEntry, 
  AgentNodeMetadata, 
  AgentNodeId 
} from '@/types/agent';
import { 
  getTraceRuns, 
  saveTraceRun, 
  getObservabilitySummary, 
  INITIAL_AGENT_NODES, 
  INITIAL_AGENT_LOGS,
  LANGSMITH_CONFIG 
} from '@/lib/services/telemetryService';
import { ObservabilityTelemetryView } from './ObservabilityTelemetryView';
import confetti from 'canvas-confetti';

interface MissionControlDashboardProps {
  stepLogs: StepLogItem[];
  ragChunks: RAGChunk[];
  matchBreakdown: MatchScoreBreakdown;
  topOpportunity: Opportunity;
  onViewDetails: (opportunity: Opportunity) => void;
  onViewRiskReport: (opportunity: Opportunity) => void;
  onViewPitch: (opportunity: Opportunity) => void;
  activeProfile: FreelancerProfile;
}

export function MissionControlDashboard({
  stepLogs,
  ragChunks,
  matchBreakdown,
  topOpportunity,
  onViewDetails,
  onViewRiskReport,
  onViewPitch,
  activeProfile,
}: MissionControlDashboardProps) {
  const [activeSubTab, setActiveSubTab] = useState<'workflow' | 'telemetry'>('workflow');
  const [traceRuns, setTraceRuns] = useState<TraceRun[]>(() => getTraceRuns());
  const [logs, setLogs] = useState<AgentLogEntry[]>(INITIAL_AGENT_LOGS);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [nodes, setNodes] = useState<AgentNodeMetadata[]>(INITIAL_AGENT_NODES);
  const [activeNodeId, setActiveNodeId] = useState<AgentNodeId | null>(null);

  const summary = getObservabilitySummary(traceRuns);

  // SVG Circular Gauge calculation
  const radius = 38;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (matchBreakdown.overallPercentage / 100) * circumference;

  // Handle live multi-agent execution simulation with telemetry logging
  const handleTriggerScan = async () => {
    if (isRunning) return;
    setIsRunning(true);

    const runId = `run-ls-${Date.now().toString(36)}`;
    const traceId = `trace-ls-${Math.floor(Math.random() * 900 + 100)}`;
    const startTime = new Date().toISOString();

    const nodeSequence: { id: AgentNodeId; name: string; msg: string; latency: number; tokens: number }[] = [
      { id: 'supervisor', name: 'LangGraph Supervisor', msg: 'Initialized graph session. Dispatched supervisor node routing.', latency: 120, tokens: 210 },
      { id: 'discovery_agent', name: 'Discovery Agent', msg: 'Tool call [tavily_search_opportunities]: Extracted active matching postings.', latency: 480, tokens: 420 },
      { id: 'rag_agent', name: 'RAG Retrieval Agent', msg: 'Tool call [supabase_pgvector_search]: Retrieved 3 pgvector resume chunks.', latency: 135, tokens: 180 },
      { id: 'risk_agent', name: 'Risk Sentinel Agent', msg: 'LLM call [gpt-4o]: Screened opportunities for scam & payment risks. 0 alerts.', latency: 410, tokens: 580 },
      { id: 'ranking_agent', name: 'Match & Ranking Agent', msg: 'Ranked opportunities by composite compatibility score.', latency: 90, tokens: 110 },
      { id: 'pitch_agent', name: 'Proposal Crafter Agent', msg: 'LLM call [gpt-4o]: Grounded proposal generated from Supabase profile.', latency: 620, tokens: 480 },
    ];

    for (let i = 0; i < nodeSequence.length; i++) {
      const step = nodeSequence[i];
      setActiveNodeId(step.id);

      setNodes((prev) =>
        prev.map((n) =>
          n.id === step.id
            ? { ...n, status: 'running', activeMessage: step.msg }
            : n
        )
      );

      const timestamp = new Date().toLocaleTimeString();
      const newLog: AgentLogEntry = {
        id: `log-${Date.now()}-${i}`,
        timestamp,
        agentId: step.id,
        level: i === 0 ? 'info' : (step.msg.includes('Tool call') ? 'agent_action' : 'success'),
        message: step.msg,
        traceId,
        latencyMs: step.latency,
      };

      setLogs((prev) => [...prev, newLog]);

      // Delay for step animation
      await new Promise((res) => setTimeout(res, 450));

      setNodes((prev) =>
        prev.map((n) =>
          n.id === step.id
            ? { ...n, status: 'completed', executionTimeMs: step.latency, tokensUsed: step.tokens }
            : n
        )
      );
    }

    setActiveNodeId(null);
    setIsRunning(false);

    // Record new trace run in telemetry
    const newTraceRun: TraceRun = {
      id: runId,
      traceId,
      name: 'LangGraph Autonomous Discovery & RAG Matching Workflow',
      runType: 'agent_workflow',
      status: 'completed',
      startTime,
      endTime: new Date().toISOString(),
      latencyMs: 1855,
      totalTokens: 1980,
      promptTokens: 1540,
      completionTokens: 440,
      estimatedCost: '$0.0135',
      tags: ['langgraph', 'langsmith-v2', 'gpt-4o', 'tavily', 'supabase-pgvector'],
      metadata: {
        candidate: activeProfile.name,
        role: activeProfile.targetRole,
        agent_nodes: 6,
      },
      llmCalls: [
        {
          id: `llm-${Date.now()}-1`,
          traceId,
          model: 'gpt-4o',
          provider: 'OpenAI',
          purpose: 'Profile Intent & Skill Extraction',
          promptTokens: 420,
          completionTokens: 85,
          totalTokens: 505,
          latencyMs: 380,
          status: 'success',
          timestamp: new Date().toLocaleTimeString(),
        },
        {
          id: `llm-${Date.now()}-2`,
          traceId,
          model: 'text-embedding-3-small',
          provider: 'OpenAI',
          purpose: 'Query Vectorization for pgvector cosine distance',
          promptTokens: 180,
          completionTokens: 0,
          totalTokens: 180,
          latencyMs: 95,
          status: 'success',
          timestamp: new Date().toLocaleTimeString(),
        },
        {
          id: `llm-${Date.now()}-3`,
          traceId,
          model: 'gpt-4o',
          provider: 'OpenAI',
          purpose: 'Risk Sentinel Fraud Classification',
          promptTokens: 520,
          completionTokens: 140,
          totalTokens: 660,
          latencyMs: 410,
          status: 'success',
          timestamp: new Date().toLocaleTimeString(),
        },
      ],
      toolCalls: [
        {
          id: `tool-${Date.now()}-1`,
          traceId,
          toolName: 'tavily_search_opportunities',
          target: 'Tavily Search API',
          inputSummary: `query: "${activeProfile.targetRole || 'AI Engineer'} remote"`,
          outputSummary: 'Discovered verified live opportunities',
          latencyMs: 480,
          status: 'success',
          timestamp: new Date().toLocaleTimeString(),
        },
        {
          id: `tool-${Date.now()}-2`,
          traceId,
          toolName: 'supabase_pgvector_search',
          target: 'Supabase portfolio_embeddings',
          inputSummary: 'match candidate resume chunks for top opportunity',
          outputSummary: 'Retrieved 3 matching pgvector chunks',
          latencyMs: 135,
          status: 'success',
          timestamp: new Date().toLocaleTimeString(),
        },
      ],
    };

    saveTraceRun(newTraceRun);
    setTraceRuns(getTraceRuns());

    confetti({
      particleCount: 50,
      spread: 70,
      origin: { y: 0.5 },
      colors: ['#00f2fe', '#4facfe', '#8b5cf6'],
    });
  };

  return (
    <div className="space-y-6 pb-12">
      
      {/* Top View Selector Bar: Workflow Graph vs Observability & Telemetry */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-2xl bg-[#090d1f] border border-slate-800 shadow-md">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveSubTab('workflow')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer ${
              activeSubTab === 'workflow'
                ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                : 'bg-slate-800/60 text-slate-400 hover:text-slate-200'
            }`}
          >
            <BrainCircuit className="w-4 h-4" />
            <span>Multi-Agent Workflow Graph</span>
          </button>

          <button
            onClick={() => setActiveSubTab('telemetry')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer ${
              activeSubTab === 'telemetry'
                ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/30 font-bold'
                : 'bg-slate-800/60 text-slate-400 hover:text-slate-200'
            }`}
          >
            <Activity className="w-4 h-4" />
            <span>AI Observability &amp; LangSmith Tracing</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded bg-cyan-950 text-cyan-300 border border-cyan-800">
              v2
            </span>
          </button>
        </div>

        <div className="flex items-center gap-3 text-xs font-mono text-slate-400 px-2">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            LangSmith: <strong className="text-cyan-300">Connected</strong>
          </span>
          <span>•</span>
          <span>Project: <strong className="text-purple-300">{LANGSMITH_CONFIG.project}</strong></span>
        </div>
      </div>

      {/* VIEW 1: AI Observability & LangSmith Traces */}
      {activeSubTab === 'telemetry' && (
        <ObservabilityTelemetryView
          traceRuns={traceRuns}
          summary={summary}
          logs={logs}
          isRunning={isRunning}
          onTriggerScan={handleTriggerScan}
        />
      )}

      {/* VIEW 2: Multi-Agent Workflow State & Matching Details */}
      {activeSubTab === 'workflow' && (
        <>
          {/* ========================================================================= */}
          {/* UPPER 3-COLUMN GRID */}
          {/* ========================================================================= */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            
            {/* COLUMN 1: AGENT EXECUTION STEPS (4 cols on lg) */}
            <div className="lg:col-span-4 rounded-2xl bg-[#0a0e1f]/90 border border-slate-800/80 p-5 flex flex-col justify-between shadow-xl">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300">
                    AGENT EXECUTION STEPS
                  </h2>
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                </div>

                <div className="space-y-2.5">
                  {stepLogs.map((step) => {
                    if (step.isSummary) {
                      return (
                        <div
                          key={step.id}
                          className="mt-3 p-3 rounded-xl bg-[#0f2425] border border-emerald-500/40 flex items-center justify-between shadow-md"
                        >
                          <div className="flex items-center gap-2.5">
                            <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                              <Check className="w-3.5 h-3.5 stroke-[3]" />
                            </div>
                            <div>
                              <span className="font-bold text-xs text-white block">
                                {step.agentName}
                              </span>
                              <span className="text-[10px] text-emerald-300/90 font-medium">
                                {step.action}
                              </span>
                            </div>
                          </div>
                          <span className="text-[10px] font-mono text-slate-400">
                            {step.timestamp}
                          </span>
                        </div>
                      );
                    }

                    return (
                      <div
                        key={step.id}
                        className="p-2.5 rounded-xl bg-[#0e142a]/80 border border-slate-800/60 flex items-center justify-between hover:border-slate-700 transition-colors"
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                            <Check className="w-2.5 h-2.5 stroke-[3]" />
                          </div>
                          <div>
                            <span className="font-semibold text-xs text-slate-200 block">
                              {step.agentName}
                            </span>
                            <span className="text-[11px] text-slate-400 line-clamp-1">
                              {step.action}
                            </span>
                          </div>
                        </div>
                        <span className="text-[10px] font-mono text-slate-500 shrink-0 ml-2">
                          {step.timestamp}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* COLUMN 2: AGENT WORKFLOW (Interactive State Graph Flowchart - 4 cols on lg) */}
            <div className="lg:col-span-4 rounded-2xl bg-[#0a0e1f]/90 border border-slate-800/80 p-5 flex flex-col shadow-xl">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300">
                  AGENT WORKFLOW
                </h2>
                <span className="text-[10px] font-mono text-purple-400 font-bold">
                  LangGraph Multi-Agent
                </span>
              </div>

              <div className="space-y-2 flex-1 flex flex-col justify-between text-center">
                
                {/* 1. User Request */}
                <div className="p-3 rounded-xl bg-[#341d63] border border-purple-500/40 text-purple-100 shadow-md">
                  <span className="text-xs font-bold block mb-1">User Request</span>
                  <p className="text-[11px] text-purple-200/90 leading-snug italic">
                    &ldquo;I&apos;m {activeProfile.name || 'a freelancer'}, an {activeProfile.targetRole.toLowerCase()} skilled in {activeProfile.skills.slice(0, 2).map(s => s.name).join(' and ') || 'AI & Cloud'}. I want {activeProfile.locationPreference.toLowerCase()} projects above {activeProfile.currency === 'INR' ? '₹' + activeProfile.hourlyRateMin.toLocaleString() : '$' + activeProfile.hourlyRateMin} that take {activeProfile.projectDuration.toLowerCase()}.&rdquo;
                  </p>
                </div>

                <div className="flex justify-center -my-1 text-slate-500">
                  <ArrowDown className="w-3.5 h-3.5" />
                </div>

                {/* 2. Profile Agent */}
                <div className="p-2.5 rounded-xl bg-[#0d2238] border border-cyan-500/40 text-cyan-100 flex items-center justify-between px-3">
                  <div className="text-left">
                    <span className="text-xs font-bold block text-white">Profile Agent</span>
                    <span className="text-[10px] text-cyan-300">
                      Extracts skills, budget, location, availability, preferences
                    </span>
                  </div>
                  <div className="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                    <Check className="w-2.5 h-2.5 stroke-[3]" />
                  </div>
                </div>

                <div className="flex justify-center -my-1 text-slate-500">
                  <ArrowDown className="w-3.5 h-3.5" />
                </div>

                {/* 3. Parallel Agents: Search Agent | RAG Agent | Preference Agent */}
                <div className="grid grid-cols-3 gap-1.5">
                  <div className="p-2 rounded-lg bg-[#0c242e] border border-cyan-500/30 text-left">
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="text-[10px] font-bold text-white">Search Agent</span>
                      <Check className="w-2.5 h-2.5 text-emerald-400 stroke-[3]" />
                    </div>
                    <span className="text-[9px] text-slate-300 leading-tight block">
                      Tavily live crawler across job boards
                    </span>
                  </div>

                  <div className="p-2 rounded-lg bg-[#0c282a] border border-emerald-500/30 text-left">
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="text-[10px] font-bold text-white">RAG Agent</span>
                      <Check className="w-2.5 h-2.5 text-emerald-400 stroke-[3]" />
                    </div>
                    <span className="text-[9px] text-slate-300 leading-tight block">
                      Supabase pgvector embeddings retrieval
                    </span>
                  </div>

                  <div className="p-2 rounded-lg bg-[#142338] border border-blue-500/30 text-left">
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="text-[10px] font-bold text-white">Preference Agent</span>
                      <Check className="w-2.5 h-2.5 text-emerald-400 stroke-[3]" />
                    </div>
                    <span className="text-[9px] text-slate-300 leading-tight block">
                      Applies user budget &amp; constraints
                    </span>
                  </div>
                </div>

                <div className="flex justify-center -my-1 text-slate-500">
                  <ArrowDown className="w-3.5 h-3.5" />
                </div>

                {/* 4. Match Agent */}
                <div className="p-2 rounded-xl bg-[#2e2614] border border-amber-500/40 text-amber-100 flex items-center justify-between px-3">
                  <div className="text-left">
                    <span className="text-xs font-bold block text-white">Match Agent</span>
                    <span className="text-[10px] text-amber-300">
                      Calculates compatibility score for each gig
                    </span>
                  </div>
                  <div className="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                    <Check className="w-2.5 h-2.5 stroke-[3]" />
                  </div>
                </div>

                <div className="flex justify-center -my-1 text-slate-500">
                  <ArrowDown className="w-3.5 h-3.5" />
                </div>

                {/* 5. Risk Agent */}
                <div className="p-2 rounded-xl bg-[#2d1419] border border-rose-500/40 text-rose-100 flex items-center justify-between px-3">
                  <div className="text-left">
                    <span className="text-xs font-bold block text-white">Risk Agent</span>
                    <span className="text-[10px] text-rose-300">
                      Detects scam &amp; low-ball opportunities
                    </span>
                  </div>
                  <div className="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                    <Check className="w-2.5 h-2.5 stroke-[3]" />
                  </div>
                </div>

                <div className="flex justify-center -my-1 text-slate-500">
                  <ArrowDown className="w-3.5 h-3.5" />
                </div>

                {/* 6. Ranking Agent */}
                <div className="p-2 rounded-xl bg-[#21163b] border border-purple-500/40 text-purple-100 flex items-center justify-between px-3">
                  <div className="text-left">
                    <span className="text-xs font-bold block text-white">Ranking Agent</span>
                    <span className="text-[10px] text-purple-300">
                      Ranks gigs based on match + risk + priority
                    </span>
                  </div>
                  <div className="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                    <Check className="w-2.5 h-2.5 stroke-[3]" />
                  </div>
                </div>

                <div className="flex justify-center -my-1 text-slate-500">
                  <ArrowDown className="w-3.5 h-3.5" />
                </div>

                {/* 7. Pitch Agent */}
                <div className="p-2 rounded-xl bg-[#112447] border border-blue-500/40 text-blue-100 flex items-center justify-between px-3">
                  <div className="text-left">
                    <span className="text-xs font-bold block text-white">Pitch Agent</span>
                    <span className="text-[10px] text-blue-300">
                      Generates personalized outreach pitch
                    </span>
                  </div>
                  <div className="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                    <Check className="w-2.5 h-2.5 stroke-[3]" />
                  </div>
                </div>

                <div className="flex justify-center -my-1 text-slate-500">
                  <ArrowDown className="w-3.5 h-3.5" />
                </div>

                {/* 8. Top Opportunities */}
                <div className="p-2.5 rounded-xl bg-[#0d2a23] border border-emerald-500/40 text-emerald-100 flex items-center justify-between px-3 shadow-md">
                  <div className="text-left">
                    <span className="text-xs font-bold block text-white">Top Opportunities</span>
                    <span className="text-[10px] text-emerald-300 font-medium">
                      Ready for user review
                    </span>
                  </div>
                  <div className="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                    <Check className="w-2.5 h-2.5 stroke-[3]" />
                  </div>
                </div>

              </div>
            </div>

            {/* COLUMN 3: RAG RETRIEVAL DETAILS & MATCH SCORING BREAKDOWN (4 cols on lg) */}
            <div className="lg:col-span-4 space-y-4">
              
              {/* Top Card: RAG RETRIEVAL DETAILS */}
              <div className="rounded-2xl bg-[#0a0e1f]/90 border border-slate-800/80 p-5 shadow-xl space-y-4">
                <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300">
                  RAG RETRIEVAL DETAILS
                </h2>

                {/* User Query Box */}
                <div>
                  <span className="text-[10px] font-mono text-slate-400 block mb-1">
                    User Query
                  </span>
                  <div className="p-2.5 rounded-xl bg-[#0e142a] border border-slate-800 text-xs font-mono text-slate-200">
                    {activeProfile.targetRole ? `${activeProfile.targetRole.toLowerCase()} ${activeProfile.locationPreference.toLowerCase()} projects` : 'Generative AI & Cloud engineering remote projects'}
                  </div>
                </div>

                {/* Top Retrieved Chunks */}
                <div className="space-y-2">
                  <span className="text-[10px] font-mono text-slate-400 block">
                    Top Retrieved Chunks
                  </span>
                  
                  {ragChunks.map((chunk, idx) => (
                    <div
                      key={chunk.id ? `mc-chunk-${chunk.id}` : `mc-chunk-${chunk.documentName || 'doc'}-${chunk.chunkIndex ?? idx}-${idx}`}
                      className="p-2.5 rounded-xl bg-[#0e142a]/90 border border-slate-800/80 flex items-start justify-between gap-2 hover:border-slate-700 transition-colors"
                    >
                      <div className="flex items-start gap-2">
                        <FileText className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                        <div>
                          <span className="text-xs font-bold text-slate-200 block">
                            {chunk.title}
                          </span>
                          <span className="text-[10px] text-slate-400 line-clamp-1">
                            {chunk.description}
                          </span>
                        </div>
                      </div>
                      <span className="text-xs font-mono font-bold text-emerald-400 shrink-0">
                        {chunk.similarityScore.toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Used Evidence Callout */}
                {ragChunks.length > 0 && (
                  <div>
                    <span className="text-[10px] font-mono text-slate-400 block mb-1">
                      Used Evidence
                    </span>
                    <div className="p-3 rounded-xl bg-[#0d2624] border border-emerald-500/40 space-y-1 shadow-sm">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <FileText className="w-3.5 h-3.5 text-emerald-400" />
                          <span className="text-xs font-bold text-white truncate max-w-[220px]">
                            {ragChunks[0].title || ragChunks[0].chunkTitle}
                          </span>
                        </div>
                        <span className="text-xs font-mono font-bold text-emerald-400">
                          {ragChunks[0].similarityScore ? ragChunks[0].similarityScore.toFixed(2) : '0.94'}
                        </span>
                      </div>
                      <p className="text-[10px] text-emerald-200/90 leading-tight">
                        <strong className="text-emerald-400">Reason: </strong>
                        {ragChunks[0].usedReason || (ragChunks[0].content ? ragChunks[0].content.slice(0, 120) + '...' : `Direct technical match with ${activeProfile.targetRole || 'candidate competencies'}.`)}
                      </p>
                    </div>
                  </div>
                )}

              </div>

              {/* Bottom Card: MATCH SCORING BREAKDOWN */}
              <div className="rounded-2xl bg-[#0a0e1f]/90 border border-slate-800/80 p-5 shadow-xl space-y-4">
                <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300">
                  MATCH SCORING BREAKDOWN
                </h2>

                <div className="grid grid-cols-12 gap-4 items-center">
                  
                  {/* Circular Gauge */}
                  <div className="col-span-5 flex flex-col items-center justify-center">
                    <div className="relative w-24 h-24 flex items-center justify-center">
                      <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                        {/* Background Circle */}
                        <circle
                          cx="50"
                          cy="50"
                          r={radius}
                          className="stroke-slate-800"
                          strokeWidth="10"
                          fill="transparent"
                        />
                        {/* Gauge Circle */}
                        <circle
                          cx="50"
                          cy="50"
                          r={radius}
                          className="stroke-cyan-400"
                          strokeWidth="10"
                          fill="transparent"
                          strokeDasharray={circumference}
                          strokeDashoffset={strokeDashoffset}
                          strokeLinecap="round"
                        />
                      </svg>
                      
                      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                        <span className="text-xl font-extrabold text-white font-mono leading-none">
                          {matchBreakdown.overallPercentage}%
                        </span>
                        <span className="text-[9px] text-slate-400 font-mono mt-0.5 leading-none">
                          Overall Match
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Category Breakdown Score List */}
                  <div className="col-span-7 space-y-1.5 text-xs">
                    {matchBreakdown.categories.map((cat, idx) => (
                      <div key={idx} className="flex items-center justify-between text-[11px]">
                        <span className="flex items-center gap-1.5 text-slate-300">
                          <span className={`w-1.5 h-1.5 rounded-full ${cat.color || 'bg-cyan-400'}`} />
                          {cat.category}
                        </span>
                        <span className="font-mono text-slate-400">
                          {cat.score} / {cat.maxScore}
                        </span>
                      </div>
                    ))}

                    <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs font-bold">
                      <span className="text-white">Total Score</span>
                      <span className="font-mono text-emerald-400">
                        {matchBreakdown.totalScore} / {matchBreakdown.maxTotalScore}
                      </span>
                    </div>
                  </div>

                </div>

              </div>

            </div>

          </div>

          {/* ========================================================================= */}
          {/* LOWER 3-CARD ROW */}
          {/* ========================================================================= */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            
            {/* CARD 1: TOP OPPORTUNITY */}
            <div className="rounded-2xl bg-[#0a0e1f]/90 border border-slate-800/80 p-5 flex flex-col justify-between shadow-xl">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300">
                    TOP OPPORTUNITY (EXAMPLE)
                  </h2>
                  <span className="text-xs font-mono font-extrabold text-emerald-400">
                    Match 94%
                  </span>
                </div>

                <div className="flex items-start gap-3">
                  <div className="p-3 rounded-xl bg-[#281b54] text-purple-300 shrink-0">
                    <Briefcase className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white line-clamp-1">
                      {topOpportunity?.title || 'Generative AI & Data Pipeline Lead'}
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5 font-mono">
                      {topOpportunity?.platform ? `Remote (${topOpportunity.platform})` : 'Remote'} • {topOpportunity?.budgetType === 'hourly' ? `$${topOpportunity.budgetMin}-$${topOpportunity.budgetMax}/hr` : `$${topOpportunity?.budgetMin?.toLocaleString() || '3,500'}`} • {topOpportunity?.estimatedDuration || '2-4 weeks'}
                    </p>
                  </div>
                </div>

                {/* Tag Pills */}
                <div className="flex flex-wrap gap-1.5 mt-4">
                  {(topOpportunity?.skillsRequired || ['Generative AI', 'Python', 'Cloud']).slice(0, 3).map((tag, idx) => (
                    <span
                      key={idx}
                      className="px-2.5 py-0.5 rounded-lg text-[10px] font-mono bg-slate-900 text-slate-300 border border-slate-800"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              <div className="pt-4 mt-4 flex justify-end">
                <button
                  onClick={() => topOpportunity && onViewDetails(topOpportunity)}
                  className="px-4 py-1.5 rounded-xl text-xs font-semibold bg-[#312563] text-purple-200 hover:bg-purple-800/80 border border-purple-500/40 transition-colors cursor-pointer"
                >
                  View Details
                </button>
              </div>
            </div>

            {/* CARD 2: RISK ANALYSIS */}
            <div className="rounded-2xl bg-[#0a0e1f]/90 border border-slate-800/80 p-5 flex flex-col justify-between shadow-xl">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300">
                    RISK ANALYSIS
                  </h2>
                </div>

                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xs text-slate-400 font-mono">Risk Level</span>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#0d2e20] text-emerald-400 border border-emerald-500/40">
                    LOW
                  </span>
                </div>

                <div className="space-y-2">
                  <span className="text-[10px] font-mono text-slate-400 block">
                    Risk Indicators
                  </span>
                  <ul className="space-y-1.5 text-xs text-slate-300">
                    <li className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-emerald-400 stroke-[3]" />
                      <span>Clear payment terms</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-emerald-400 stroke-[3]" />
                      <span>Client has verified hiring history</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-emerald-400 stroke-[3]" />
                      <span>Detailed technical requirements</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-emerald-400 stroke-[3]" />
                      <span>No suspicious keywords or escrow risks detected</span>
                    </li>
                  </ul>
                </div>
              </div>

              <div className="pt-4 mt-2 flex justify-end">
                <button
                  onClick={() => topOpportunity && onViewRiskReport(topOpportunity)}
                  className="px-3.5 py-1.5 rounded-xl text-[11px] font-mono font-medium text-slate-400 hover:text-slate-200 bg-slate-900 border border-slate-800 hover:border-slate-700 transition-colors"
                >
                  Inspect Sentinel Log
                </button>
              </div>
            </div>

            {/* CARD 3: GENERATED PITCH (PREVIEW) */}
            <div className="rounded-2xl bg-[#0a0e1f]/90 border border-slate-800/80 p-5 flex flex-col justify-between shadow-xl">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300">
                    GENERATED PITCH (PREVIEW)
                  </h2>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed line-clamp-5 font-mono bg-[#070b18] p-3 rounded-xl border border-slate-800/80">
                  Hi {topOpportunity?.clientName || 'there'},<br />
                  I reviewed your requirement for &quot;{topOpportunity?.title || 'the project'}&quot;. Having worked on similar implementations in {activeProfile.skills.slice(0, 2).map((s: any) => typeof s === 'string' ? s : s?.name).join(', ') || activeProfile.targetRole || 'this domain'}, I can deliver milestone-driven results with verified reliability.<br /><br />
                  Looking forward to discussing the technical specifications!<br /><br />
                  Best regards,<br />
                  {activeProfile.name || 'Akshaya'}<br />
                  {activeProfile.targetRole || 'AI & Data Engineering Freelancer'}
                </p>
              </div>

              <div className="pt-4 mt-2 flex justify-end">
                <button
                  onClick={() => topOpportunity && onViewPitch(topOpportunity)}
                  className="px-4 py-1.5 rounded-xl text-xs font-semibold bg-[#312563] text-purple-200 hover:bg-purple-800/80 border border-purple-500/40 transition-colors cursor-pointer"
                >
                  View Full Pitch
                </button>
              </div>
            </div>

          </div>
        </>
      )}

    </div>
  );
}
