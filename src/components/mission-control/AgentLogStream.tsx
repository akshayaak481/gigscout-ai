'use client';

import React, { useRef, useEffect } from 'react';
import { Terminal, Shield, Sparkles, CheckCircle2, AlertTriangle, Play, Flame } from 'lucide-react';
import { AgentLogEntry } from '@/types/agent';

interface AgentLogStreamProps {
  logs: AgentLogEntry[];
  isRunning?: boolean;
}

export function AgentLogStream({ logs, isRunning = false }: AgentLogStreamProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [logs]);

  const getLevelBadge = (level: AgentLogEntry['level']) => {
    switch (level) {
      case 'success':
        return <span className="text-emerald-400 font-bold">[SUCCESS]</span>;
      case 'warn':
        return <span className="text-amber-400 font-bold">[RISK_ALERT]</span>;
      case 'error':
        return <span className="text-rose-400 font-bold">[ERROR]</span>;
      case 'agent_action':
        return <span className="text-cyan-400 font-bold">[TOOL_CALL]</span>;
      default:
        return <span className="text-slate-400 font-bold">[INFO]</span>;
    }
  };

  return (
    <div className="rounded-2xl border border-cyan-900/40 bg-[#050814] overflow-hidden shadow-2xl">
      {/* Terminal Title Bar */}
      <div className="px-4 py-2.5 bg-[#090e21] border-b border-cyan-950 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80 inline-block" />
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80 inline-block" />
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80 inline-block" />
          </div>
          <span className="text-xs font-mono font-bold text-slate-300 ml-2 flex items-center gap-1.5">
            <Terminal className="w-3.5 h-3.5 text-cyan-400" />
            Live Agentic Telemetry Stream
          </span>
        </div>

        <div className="flex items-center gap-2">
          {isRunning && (
            <span className="flex items-center gap-1.5 text-[11px] font-mono text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/30 animate-pulse">
              <Flame className="w-3 h-3 text-amber-400" />
              Streaming Graph Nodes...
            </span>
          )}
          <span className="text-[10px] font-mono text-slate-500">
            LangSmith Tracing v2
          </span>
        </div>
      </div>

      {/* Log Feed Console */}
      <div 
        ref={containerRef}
        className="p-4 font-mono text-xs text-slate-300 max-h-56 overflow-y-auto space-y-2 select-text"
      >
        {logs.map((log) => (
          <div key={log.id} className="flex items-start gap-2 leading-relaxed">
            <span className="text-slate-500 text-[11px] shrink-0">{log.timestamp}</span>
            <span className="text-violet-400 font-semibold shrink-0">@{log.agentId}</span>
            <span className="shrink-0">{getLevelBadge(log.level)}</span>
            <span className="text-slate-200">{log.message}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
