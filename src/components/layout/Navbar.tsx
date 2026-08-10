'use client';

import React from 'react';
import { 
  Bot, 
  ShieldCheck, 
  Sparkles, 
  User, 
  Radio, 
  FileText, 
  Cpu
} from 'lucide-react';
import { FreelancerProfile } from '@/types/profile';

interface NavbarProps {
  activeProfile: FreelancerProfile;
  profiles: FreelancerProfile[];
  onSelectProfile: (profile: FreelancerProfile) => void;
  onOpenResumeModal: () => void;
  onScrollToMissionControl: () => void;
  isAgentRunning?: boolean;
}

export function Navbar({
  activeProfile,
  profiles,
  onSelectProfile,
  onOpenResumeModal,
  onScrollToMissionControl,
  isAgentRunning = false,
}: NavbarProps) {
  return (
    <header className="sticky top-0 z-40 w-full backdrop-blur-xl bg-[#060813]/85 border-b border-cyan-900/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Brand Logo & Tagline */}
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 via-blue-600 to-violet-600 p-[1px] shadow-lg shadow-cyan-500/20">
            <div className="w-full h-full bg-[#0b0f1e] rounded-[11px] flex items-center justify-center">
              <Bot className="w-5 h-5 text-cyan-400 animate-pulse" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-lg tracking-tight text-white font-mono">
                GigScout<span className="text-cyan-400">.AI</span>
              </span>
              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-cyan-500/10 text-cyan-300 border border-cyan-500/30">
                Agentic v1.0
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block">
              Freelance Opportunity & Risk Intelligence
            </p>
          </div>
        </div>

        {/* Live Status Telemetry & Quick Navigation */}
        <div className="hidden md:flex items-center gap-3">
          <button
            onClick={onScrollToMissionControl}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-mono transition-all duration-200 ${
              isAgentRunning
                ? 'bg-amber-500/15 border-amber-500/50 text-amber-300 animate-pulse shadow-lg shadow-amber-500/20'
                : 'bg-slate-900/80 border-slate-700/60 text-slate-300 hover:border-cyan-500/50 hover:text-cyan-300'
            }`}
          >
            <Radio className={`w-3.5 h-3.5 ${isAgentRunning ? 'text-amber-400 animate-spin' : 'text-cyan-400'}`} />
            <span>{isAgentRunning ? 'Agents Active (Streaming)' : 'Mission Control Online'}</span>
          </button>

          <div className="h-4 w-[1px] bg-slate-800" />

          <div className="flex items-center gap-2 px-2.5 py-1 rounded-md bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Risk Sentinel: Armed</span>
          </div>
        </div>

        {/* User Profile Switcher & Actions */}
        <div className="flex items-center gap-2.5">
          {/* Resume Ingestion Button */}
          <button
            onClick={onOpenResumeModal}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800/80 hover:bg-slate-700 border border-slate-700/80 text-slate-200 hover:text-white transition-all shadow-sm hover:border-slate-600"
            title="Upload or Parse Resume / Portfolio"
          >
            <FileText className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline">Resume RAG</span>
          </button>

          {/* Profile Switcher Dropdown */}
          <div className="relative flex items-center bg-[#0e1629] border border-cyan-800/40 rounded-xl p-1 shadow-inner">
            <div className="flex items-center gap-2 px-2 py-1">
              <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-cyan-500 to-violet-600 flex items-center justify-center text-white text-[11px] font-bold">
                {activeProfile.name.charAt(0)}
              </div>
              <select
                value={activeProfile.id}
                onChange={(e) => {
                  const selected = profiles.find((p) => p.id === e.target.value);
                  if (selected) onSelectProfile(selected);
                }}
                className="bg-transparent text-xs text-white font-medium focus:outline-none cursor-pointer pr-1"
              >
                {profiles.map((prof) => (
                  <option key={prof.id} value={prof.id} className="bg-[#0b0f1e] text-white">
                    {prof.name} ({prof.targetRole.split('/')[0].trim()})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* GitHub link */}
          <a
            href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 rounded-lg bg-slate-800/60 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors border border-slate-800"
            title="View on GitHub"
          >
            <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
              <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
            </svg>
          </a>
        </div>

      </div>
    </header>
  );
}
