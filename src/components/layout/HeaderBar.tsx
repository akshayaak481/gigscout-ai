'use client';

import React, { useState, useEffect } from 'react';
import { Radio, ShieldCheck } from 'lucide-react';
import { DashboardTab } from '@/types/dashboard';

interface HeaderBarProps {
  currentTab: DashboardTab;
}

export function HeaderBar({ currentTab }: HeaderBarProps) {
  const [timeStr, setTimeStr] = useState<string>('16:42:09');
  const [dateStr, setDateStr] = useState<string>('May 21, 2025');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(now.toTimeString().split(' ')[0]);
      setDateStr(now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const getTabHeaders = () => {
    switch (currentTab) {
      case 'mission_control':
        return {
          title: 'AI Mission Control',
          subtitle: 'Real-time execution of your opportunity scouting agent',
        };
      case 'scout':
        return {
          title: 'Opportunity Scout',
          subtitle: 'Describe requirements in natural language and dispatch autonomous search agents',
        };
      case 'opportunities':
        return {
          title: 'Discovered Opportunities',
          subtitle: 'Filtered gig listings with risk assessments and AI compatibility rankings',
        };
      case 'saved':
        return {
          title: 'Saved Opportunities',
          subtitle: 'Your shortlisted freelance leads and active proposals',
        };
      case 'knowledge_base':
        return {
          title: 'RAG Knowledge Base',
          subtitle: 'Vector DB portfolio chunks, embeddings, and evidence retrieval locker',
        };
      case 'profile':
        return {
          title: 'Freelancer Profile',
          subtitle: 'Manage your verified skills, experience, portfolio projects, and target rates',
        };
      case 'settings':
        return {
          title: 'System Settings',
          subtitle: 'Configure OpenAI, LangGraph, Tavily, Supabase and telemetry keys',
        };
    }
  };

  const headers = getTabHeaders();

  return (
    <header className="h-20 px-8 flex items-center justify-between border-b border-slate-800/80 bg-[#070b18]/90 backdrop-blur-md sticky top-0 z-30">
      
      {/* View Title & Subtitle */}
      <div>
        <h1 className="text-xl font-extrabold text-white tracking-tight">
          {headers.title}
        </h1>
        <p className="text-xs text-slate-400 mt-0.5">
          {headers.subtitle}
        </p>
      </div>

      {/* Status & Live Clock */}
      <div className="flex items-center gap-4">
        
        {/* System Status Badge */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#0e1d23] border border-emerald-500/40 text-emerald-400 text-xs font-mono font-semibold shadow-sm">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>System Status: Active</span>
        </div>

        {/* Live Clock & Date */}
        <div className="text-right font-mono text-xs text-slate-300 bg-slate-900/80 px-3.5 py-1.5 rounded-lg border border-slate-800">
          <div className="font-bold text-slate-100">{timeStr}</div>
          <div className="text-[10px] text-slate-500">{dateStr}</div>
        </div>

      </div>

    </header>
  );
}
