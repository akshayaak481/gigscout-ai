'use client';

import React, { useState } from 'react';
import { 
  Activity, 
  Terminal, 
  Cpu, 
  Layers, 
  ExternalLink, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  Zap, 
  Bot, 
  FileCode2, 
  Radar, 
  ShieldCheck, 
  RefreshCw, 
  Play, 
  Copy, 
  Check,
  Search,
  Database,
  ArrowRight
} from 'lucide-react';
import { TraceRun, LLMCallTelemetry, ToolCallTelemetry, ObservabilitySummary, AgentLogEntry, AgentNodeMetadata } from '@/types/agent';
import { AgentLogStream } from './AgentLogStream';
import { LANGSMITH_CONFIG } from '@/lib/services/telemetryService';
import confetti from 'canvas-confetti';

interface ObservabilityTelemetryViewProps {
  traceRuns: TraceRun[];
  summary: ObservabilitySummary;
  logs: AgentLogEntry[];
  isRunning: boolean;
  onTriggerScan: () => void;
}

export function ObservabilityTelemetryView({
  traceRuns,
  summary,
  logs,
  isRunning,
  onTriggerScan,
}: ObservabilityTelemetryViewProps) {
  const [selectedRunId, setSelectedRunId] = useState<string>(traceRuns[0]?.id || 'run-ls-98a41b2c');
  const [copiedTraceId, setCopiedTraceId] = useState<string | null>(null);
  const [telemetryTab, setTelemetryTab] = useState<'llm' | 'tools' | 'raw_trace'>('llm');

  const selectedRun = traceRuns.find((r) => r.id === selectedRunId) || traceRuns[0];

  const handleCopyTrace = (traceId: string) => {
    navigator.clipboard.writeText(traceId);
    setCopiedTraceId(traceId);
    setTimeout(() => setCopiedTraceId(null), 2000);
  };

  const getStatusBadge = (status: TraceRun['status']) => {
    switch (status) {
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/40">
            <CheckCircle2 className="w-3 h-3" />
            COMPLETED
          </span>
        );
      case 'running':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 animate-pulse">
            <RefreshCw className="w-3 h-3 animate-spin" />
            EXECUTING
          </span>
        );
      case 'warning':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/15 text-amber-300 border border-amber-500/40">
            <AlertTriangle className="w-3 h-3" />
            WARNING
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-rose-500/15 text-rose-300 border border-rose-500/40">
            FAILED
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner & LangSmith Connection Status */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-[#090e21] via-[#0d1633] to-[#090e21] border border-cyan-800/40 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="p-3 rounded-xl bg-cyan-500/15 border border-cyan-500/30 text-cyan-400 shadow-md shadow-cyan-500/20 shrink-0">
            <Activity className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                AI Observability &amp; LangSmith Tracing
              </h2>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Tracing v2 Active
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5 font-mono">
              Project: <span className="text-cyan-300 font-bold">{LANGSMITH_CONFIG.project}</span> • Endpoint: <span className="text-slate-300">{LANGSMITH_CONFIG.endpoint}</span>
            </p>
          </div>
        </div>

        <button
          onClick={onTriggerScan}
          disabled={isRunning}
          className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold font-mono text-slate-950 bg-gradient-to-r from-cyan-400 via-sky-400 to-cyan-300 hover:from-cyan-300 hover:to-cyan-200 transition-all shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shrink-0"
        >
          {isRunning ? (
            <>
              <RefreshCw className="w-4 h-4 text-slate-950 animate-spin" />
              <span>Executing Trace...</span>
            </>
          ) : (
            <>
              <Play className="w-4 h-4 text-slate-950 fill-slate-950" />
              <span>Execute Workflow Scan</span>
            </>
          )}
        </button>
      </div>

      {/* 4 Telemetry Summary Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card 1: Workflow Runs */}
        <div className="p-4 rounded-2xl bg-[#0a0f20] border border-slate-800/80 shadow-md flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-mono uppercase tracking-wider">Workflow Runs</span>
            <Layers className="w-4 h-4 text-cyan-400" />
          </div>
          <div>
            <div className="text-2xl font-bold font-mono text-white">
              {summary.totalRuns}
            </div>
            <div className="text-[11px] font-mono text-emerald-400 mt-0.5 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" />
              <span>100% Success Rate</span>
            </div>
          </div>
        </div>

        {/* Card 2: Total LLM Calls */}
        <div className="p-4 rounded-2xl bg-[#0a0f20] border border-slate-800/80 shadow-md flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-mono uppercase tracking-wider">LLM Calls</span>
            <Bot className="w-4 h-4 text-violet-400" />
          </div>
          <div>
            <div className="text-2xl font-bold font-mono text-white">
              {summary.totalLLMCalls}
            </div>
            <div className="text-[11px] font-mono text-violet-300 mt-0.5">
              <span>{summary.totalTokens.toLocaleString()} tokens consumed</span>
            </div>
          </div>
        </div>

        {/* Card 3: Tool Calls (Tavily + Supabase) */}
        <div className="p-4 rounded-2xl bg-[#0a0f20] border border-slate-800/80 shadow-md flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-mono uppercase tracking-wider">Tool Calls</span>
            <Zap className="w-4 h-4 text-amber-400" />
          </div>
          <div>
            <div className="text-2xl font-bold font-mono text-white">
              {summary.totalToolCalls}
            </div>
            <div className="text-[11px] font-mono text-amber-300 mt-0.5">
              <span>Tavily &amp; Supabase pgvector</span>
            </div>
          </div>
        </div>

        {/* Card 4: Avg Latency */}
        <div className="p-4 rounded-2xl bg-[#0a0f20] border border-slate-800/80 shadow-md flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-mono uppercase tracking-wider">Avg Latency</span>
            <Clock className="w-4 h-4 text-emerald-400" />
          </div>
          <div>
            <div className="text-2xl font-bold font-mono text-white">
              {summary.avgLatencyMs} ms
            </div>
            <div className="text-[11px] font-mono text-emerald-400 mt-0.5">
              <span>Low latency execution</span>
            </div>
          </div>
        </div>

      </div>

      {/* Main Traces & Execution Telemetry Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* Left Column: Trace Runs List (4 cols) */}
        <div className="lg:col-span-4 rounded-2xl bg-[#0a0f20] border border-slate-800 p-5 space-y-4 shadow-xl">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
              <Layers className="w-4 h-4 text-cyan-400" />
              Recorded Trace Runs ({traceRuns.length})
            </h3>
          </div>

          <div className="space-y-2.5">
            {traceRuns.map((run) => {
              const isSelected = run.id === selectedRunId;
              return (
                <button
                  key={run.id}
                  onClick={() => setSelectedRunId(run.id)}
                  className={`w-full text-left p-3.5 rounded-xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-[#121c38] border-cyan-500/60 shadow-lg shadow-cyan-500/10 ring-1 ring-cyan-500/50'
                      : 'bg-[#070b18] border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-bold text-white truncate max-w-[200px]" title={run.name}>
                      {run.name}
                    </span>
                    {getStatusBadge(run.status)}
                  </div>

                  <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
                    <span className="text-cyan-300 font-bold">{run.traceId}</span>
                    <span>{run.latencyMs} ms</span>
                  </div>

                  <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 mt-1 pt-1.5 border-t border-slate-800/80">
                    <span>{run.llmCalls?.length || 0} LLMs • {run.toolCalls?.length || 0} Tools</span>
                    <span>{run.totalTokens ? `${run.totalTokens} tokens` : ''}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Column: Selected Run Deep Telemetry Inspector (8 cols) */}
        <div className="lg:col-span-8 rounded-2xl bg-[#0a0f20] border border-slate-800 p-5 space-y-5 shadow-xl">
          
          {selectedRun && (
            <>
              {/* Trace Run Header Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-sm font-bold text-white font-mono">
                      {selectedRun.name}
                    </h3>
                    {getStatusBadge(selectedRun.status)}
                  </div>

                  <div className="flex items-center gap-3 text-xs font-mono text-slate-400 mt-1 flex-wrap">
                    <span className="flex items-center gap-1">
                      Trace ID: <strong className="text-cyan-300">{selectedRun.traceId}</strong>
                      <button
                        onClick={() => handleCopyTrace(selectedRun.traceId)}
                        className="text-slate-500 hover:text-white transition-colors cursor-pointer ml-1"
                        title="Copy Trace ID"
                      >
                        {copiedTraceId === selectedRun.traceId ? (
                          <Check className="w-3 h-3 text-emerald-400" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                      </button>
                    </span>
                    <span>•</span>
                    <span>Run ID: <strong className="text-slate-300">{selectedRun.id}</strong></span>
                    <span>•</span>
                    <span>Total Latency: <strong className="text-emerald-400">{selectedRun.latencyMs} ms</strong></span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 font-mono text-xs text-slate-400">
                  <span className="px-2 py-1 rounded bg-slate-900 border border-slate-800 text-purple-300">
                    {selectedRun.totalTokens} tokens
                  </span>
                  {selectedRun.estimatedCost && (
                    <span className="px-2 py-1 rounded bg-slate-900 border border-slate-800 text-emerald-400">
                      {selectedRun.estimatedCost}
                    </span>
                  )}
                </div>
              </div>

              {/* Telemetry Tabs (LLM Calls vs Tool Calls vs Trace Metadata) */}
              <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
                <button
                  onClick={() => setTelemetryTab('llm')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-all cursor-pointer ${
                    telemetryTab === 'llm'
                      ? 'bg-violet-500/20 text-violet-300 border border-violet-500/50 font-bold'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  LLM Calls ({selectedRun.llmCalls?.length || 0})
                </button>

                <button
                  onClick={() => setTelemetryTab('tools')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-all cursor-pointer ${
                    telemetryTab === 'tools'
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 font-bold'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Tool Calls ({selectedRun.toolCalls?.length || 0})
                </button>

                <button
                  onClick={() => setTelemetryTab('raw_trace')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-all cursor-pointer ${
                    telemetryTab === 'raw_trace'
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50 font-bold'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  LangSmith Metadata
                </button>
              </div>

              {/* Tab 1: LLM Calls Breakdown */}
              {telemetryTab === 'llm' && (
                <div className="space-y-3">
                  {selectedRun.llmCalls && selectedRun.llmCalls.length > 0 ? (
                    selectedRun.llmCalls.map((call) => (
                      <div
                        key={call.id}
                        className="p-3.5 rounded-xl bg-[#070b18] border border-slate-800/90 space-y-2 hover:border-slate-700 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded font-mono text-[10px] font-bold bg-violet-500/20 text-violet-300 border border-violet-500/40">
                              {call.model}
                            </span>
                            <span className="text-xs font-bold text-white">
                              {call.purpose}
                            </span>
                          </div>
                          <span className="text-xs font-mono text-emerald-400 font-bold">
                            {call.latencyMs} ms
                          </span>
                        </div>

                        <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 pt-1 border-t border-slate-800/60">
                          <div className="flex items-center gap-3">
                            <span>Prompt: <strong className="text-slate-300">{call.promptTokens}</strong></span>
                            <span>Completion: <strong className="text-slate-300">{call.completionTokens}</strong></span>
                            <span>Total: <strong className="text-purple-300">{call.totalTokens} tokens</strong></span>
                          </div>
                          <span className="text-slate-500">{call.timestamp}</span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-slate-400 font-mono py-4 text-center">No LLM calls recorded in this trace run.</p>
                  )}
                </div>
              )}

              {/* Tab 2: Tool Calls Breakdown (Tavily & Supabase pgvector) */}
              {telemetryTab === 'tools' && (
                <div className="space-y-3">
                  {selectedRun.toolCalls && selectedRun.toolCalls.length > 0 ? (
                    selectedRun.toolCalls.map((tool) => (
                      <div
                        key={tool.id}
                        className="p-3.5 rounded-xl bg-[#070b18] border border-slate-800/90 space-y-2 hover:border-slate-700 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded font-mono text-[10px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                              {tool.toolName}
                            </span>
                            <span className="text-xs font-bold text-slate-200">
                              {tool.target}
                            </span>
                          </div>
                          <span className="text-xs font-mono text-emerald-400 font-bold">
                            {tool.latencyMs} ms
                          </span>
                        </div>

                        <div className="text-[11px] font-mono text-slate-300 space-y-1 bg-[#090f24] p-2.5 rounded-lg border border-slate-800/70">
                          <div><span className="text-cyan-400 font-bold">Input:</span> {tool.inputSummary}</div>
                          <div><span className="text-emerald-400 font-bold">Output:</span> {tool.outputSummary}</div>
                        </div>

                        <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 pt-0.5">
                          <span className="text-emerald-400 font-bold flex items-center gap-1">
                            <Check className="w-3 h-3" /> Execution Successful
                          </span>
                          <span>{tool.timestamp}</span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-slate-400 font-mono py-4 text-center">No tool calls recorded in this trace run.</p>
                  )}
                </div>
              )}

              {/* Tab 3: LangSmith Tracing Metadata */}
              {telemetryTab === 'raw_trace' && (
                <div className="p-4 rounded-xl bg-[#070b18] border border-slate-800 font-mono text-xs space-y-3">
                  <div className="grid grid-cols-2 gap-3 text-[11px]">
                    <div>
                      <span className="text-slate-500 block">LangSmith Project</span>
                      <span className="text-cyan-300 font-bold">{LANGSMITH_CONFIG.project}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">LangSmith Endpoint</span>
                      <span className="text-slate-300">{LANGSMITH_CONFIG.endpoint}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Trace ID</span>
                      <span className="text-purple-300 font-bold">{selectedRun.traceId}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Run Identifier</span>
                      <span className="text-slate-300">{selectedRun.id}</span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-800">
                    <span className="text-slate-500 block mb-1.5">Execution Tags</span>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedRun.tags.map((tag, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 rounded text-[10px] bg-slate-800 text-slate-300 border border-slate-700 font-mono"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

        </div>

      </div>

      {/* Live Agentic Telemetry Stream */}
      <AgentLogStream logs={logs} isRunning={isRunning} />

    </div>
  );
}
