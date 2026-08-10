'use client';

import React from 'react';
import { 
  Bot, 
  Radar, 
  FileCode2, 
  ShieldAlert, 
  Sparkles, 
  PenTool, 
  Play, 
  RefreshCw, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  Activity, 
  Layers,
  ArrowRight,
  BrainCircuit,
  Zap
} from 'lucide-react';
import { AgentNodeMetadata, AgentNodeId, AgentLogEntry } from '@/types/agent';
import { AgentLogStream } from './AgentLogStream';

interface AgentControlViewProps {
  nodes: AgentNodeMetadata[];
  activeNodeId: AgentNodeId | null;
  isRunning: boolean;
  onTriggerScan: () => void;
  logs: AgentLogEntry[];
}

export function AgentControlView({
  nodes,
  activeNodeId,
  isRunning,
  onTriggerScan,
  logs,
}: AgentControlViewProps) {
  
  const getNodeIcon = (id: AgentNodeId) => {
    switch (id) {
      case 'supervisor':
        return <BrainCircuit className="w-5 h-5" />;
      case 'discovery_agent':
        return <Radar className="w-5 h-5" />;
      case 'rag_agent':
        return <FileCode2 className="w-5 h-5" />;
      case 'risk_agent':
        return <ShieldAlert className="w-5 h-5" />;
      case 'ranking_agent':
        return <Sparkles className="w-5 h-5" />;
      case 'pitch_agent':
        return <PenTool className="w-5 h-5" />;
    }
  };

  const getStatusIndicator = (status: AgentNodeMetadata['status'], isActive: boolean) => {
    if (isActive) {
      return (
        <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
          EXECUTING
        </span>
      );
    }
    switch (status) {
      case 'completed':
        return (
          <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
            <CheckCircle2 className="w-3 h-3" />
            DONE
          </span>
        );
      case 'warning':
        return (
          <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono bg-amber-500/15 text-amber-300 border border-amber-500/30">
            <AlertTriangle className="w-3 h-3" />
            ALERT
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-slate-800 text-slate-400 border border-slate-700">
            STANDBY
          </span>
        );
    }
  };

  return (
    <div id="mission-control-section" className="space-y-6">
      
      {/* Top Banner & Trigger Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-[#0b1024] via-[#101938] to-[#0b1024] border border-cyan-800/40 shadow-xl">
        <div className="flex items-center gap-3.5">
          <div className="p-3 rounded-xl bg-cyan-500/15 border border-cyan-500/30 text-cyan-400 shadow-md shadow-cyan-500/20">
            <Activity className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-white tracking-tight">
                Agent Mission Control
              </h2>
              <span className="text-[10px] px-2 py-0.5 rounded-full font-mono bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                LangGraph State Engine
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Live multi-agent coordination graph monitoring crawl discovery, risk inspection, and RAG matching.
            </p>
          </div>
        </div>

        {/* Trigger Button */}
        <button
          onClick={onTriggerScan}
          disabled={isRunning}
          className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-slate-900 bg-gradient-to-r from-cyan-400 via-sky-400 to-cyan-300 hover:from-cyan-300 hover:to-cyan-200 transition-all shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        >
          {isRunning ? (
            <>
              <RefreshCw className="w-4 h-4 text-slate-900 animate-spin" />
              <span>Orchestrating Agents...</span>
            </>
          ) : (
            <>
              <Play className="w-4 h-4 text-slate-900 fill-slate-900" />
              <span>Run Agent Workflow Scan</span>
            </>
          )}
        </button>
      </div>

      {/* Interactive Agent Pipeline Nodes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {nodes.map((node) => {
          const isActive = activeNodeId === node.id;
          return (
            <div
              key={node.id}
              className={`p-4 rounded-2xl border transition-all duration-300 flex flex-col justify-between ${
                isActive
                  ? 'bg-[#152044] border-cyan-400 shadow-xl shadow-cyan-500/20 ring-1 ring-cyan-400 scale-[1.02]'
                  : 'bg-[#0a0f20]/90 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div>
                {/* Node Header */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2.5">
                    <div className={`p-2 rounded-xl ${
                      isActive 
                        ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/30' 
                        : 'bg-slate-800 text-cyan-400'
                    }`}>
                      {getNodeIcon(node.id)}
                    </div>
                    <div>
                      <h4 className="font-bold text-xs text-white">
                        {node.name}
                      </h4>
                      <p className="text-[10px] text-slate-400 font-mono">
                        {node.role}
                      </p>
                    </div>
                  </div>

                  {getStatusIndicator(node.status, isActive)}
                </div>

                {/* Node Description */}
                <p className="text-xs text-slate-300 leading-relaxed mb-3">
                  {node.description}
                </p>
              </div>

              {/* Node Live State Footer */}
              <div className="pt-3 border-t border-slate-800/80 mt-2 flex items-center justify-between text-[11px] font-mono text-slate-400">
                <span className="text-slate-300 truncate max-w-[170px]" title={node.activeMessage}>
                  {node.activeMessage || 'Ready'}
                </span>
                <div className="flex items-center gap-2 text-[10px] text-slate-500 shrink-0">
                  {node.executionTimeMs ? <span>{node.executionTimeMs}ms</span> : null}
                  {node.tokensUsed ? <span>• {node.tokensUsed} tkn</span> : null}
                </div>
              </div>

            </div>
          );
        })}
      </div>

      {/* Live Terminal Telemetry Stream */}
      <AgentLogStream logs={logs} isRunning={isRunning} />

    </div>
  );
}
