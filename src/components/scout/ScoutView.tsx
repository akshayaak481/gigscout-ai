'use client';

import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Bot, 
  Sparkles, 
  SlidersHorizontal, 
  DollarSign, 
  Clock, 
  MapPin, 
  Play, 
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  Zap,
  RefreshCw
} from 'lucide-react';
import { FreelancerProfile } from '@/types/profile';

interface ScoutViewProps {
  activeProfile: FreelancerProfile;
  onLaunchMission: (query: string, profileId: string) => void;
  isSearching?: boolean;
}

export function ScoutView({ activeProfile, onLaunchMission, isSearching = false }: ScoutViewProps) {
  const topSkills = (activeProfile.skills || [])
    .slice(0, 3)
    .map(s => (typeof s === 'string' ? s : s.name))
    .join(', ');

  const defaultPromptForProfile = topSkills
    ? `Looking for ${activeProfile.targetRole} gigs requiring ${topSkills}, ${activeProfile.locationPreference || 'remote'} only`
    : `Looking for freelance ${activeProfile.targetRole} opportunities with flexible remote timeline`;

  const [query, setQuery] = useState<string>(defaultPromptForProfile);

  // Sync default prompt when active profile switches (e.g. Akshaya -> Priya Sharma)
  useEffect(() => {
    const skillsList = (activeProfile.skills || [])
      .slice(0, 3)
      .map(s => (typeof s === 'string' ? s : s.name))
      .join(', ');

    const prompt = skillsList
      ? `Looking for ${activeProfile.targetRole} gigs requiring ${skillsList}, ${activeProfile.locationPreference || 'remote'} only`
      : `Looking for freelance ${activeProfile.targetRole} opportunities with flexible remote timeline`;

    setQuery(prompt);
  }, [activeProfile.id, activeProfile.name, activeProfile.targetRole]);

  const suggestedPrompts = [
    `${activeProfile.targetRole} (${activeProfile.currency === 'INR' ? '₹15k+' : '$50-$90/hr'})`,
    topSkills ? `${topSkills} freelance consultant` : `${activeProfile.targetRole} remote gigs`,
    `Short-term 1-2 week ${activeProfile.targetRole.split('/')[0].trim()} projects`,
    `Enterprise contract: ${activeProfile.targetRole.split('/')[0].trim()}`,
  ];

  return (
    <div className="space-y-8 max-w-5xl mx-auto py-4">
      
      {/* Scout Header Hero */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono font-semibold bg-purple-500/10 border border-purple-500/30 text-purple-300">
          <Sparkles className="w-3.5 h-3.5 text-purple-400" />
          <span>Natural Language Opportunity Scout</span>
        </div>
        <h2 className="text-3xl font-extrabold text-white tracking-tight">
          What kind of freelance work are you looking for today?
        </h2>
        <p className="text-sm text-slate-400 max-w-2xl mx-auto leading-relaxed">
          Describe your ideal freelance project in natural language. Our autonomous agent network will query active boards for <strong className="text-purple-300 font-semibold">{activeProfile.name}</strong>, screen scams with Risk Sentinel, and match against your actual profile.
        </p>
      </div>

      {/* Main Search Input & Launcher */}
      <div className="p-6 rounded-2xl bg-[#0a0e1f] border border-purple-900/40 shadow-2xl shadow-purple-950/20 space-y-4">
        
        <div className="space-y-2">
          <label className="text-xs font-mono text-slate-400 uppercase tracking-wider block">
            Natural Language Requirement Query
          </label>
          <div className="relative">
            <textarea
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              rows={3}
              placeholder={`e.g. Looking for freelance ${activeProfile.targetRole} projects...`}
              className="w-full p-4 rounded-xl bg-[#070b18] border border-slate-800 text-slate-200 placeholder-slate-500 text-sm focus:outline-none focus:border-purple-500/60 font-mono transition-colors resize-none"
            />
          </div>
        </div>

        {/* Query Suggestions */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[11px] font-mono text-slate-500">Suggestions:</span>
          {suggestedPrompts.map((prompt, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setQuery(prompt)}
              className="px-2.5 py-1 rounded-lg text-xs font-mono bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-purple-300 border border-slate-800 transition-colors cursor-pointer"
            >
              {prompt}
            </button>
          ))}
        </div>

        {/* Constraint Filters Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-3 border-t border-slate-800/80">
          
          <div>
            <span className="text-[10px] font-mono text-slate-500 uppercase block mb-1">
              Active Freelancer Profile
            </span>
            <div className="p-2.5 rounded-lg bg-[#070b18] border border-slate-800 text-xs font-semibold text-slate-200 truncate">
              {activeProfile.name} • {activeProfile.targetRole}
            </div>
          </div>

          <div>
            <span className="text-[10px] font-mono text-slate-500 uppercase block mb-1">
              Minimum Budget Filter
            </span>
            <div className="p-2.5 rounded-lg bg-[#070b18] border border-slate-800 text-xs font-mono font-bold text-emerald-400">
              {activeProfile.currency === 'INR'
                ? `₹${activeProfile.hourlyRateMin.toLocaleString()}+ / project`
                : `$${activeProfile.hourlyRateMin}+ / hr`}
            </div>
          </div>

          <div>
            <span className="text-[10px] font-mono text-slate-500 uppercase block mb-1">
              Target Duration &amp; Location
            </span>
            <div className="p-2.5 rounded-lg bg-[#070b18] border border-slate-800 text-xs font-mono text-slate-200">
              {activeProfile.projectDuration || '1 - 2 weeks'} ({activeProfile.locationPreference || 'Remote'})
            </div>
          </div>

        </div>

        {/* Launch Button */}
        <div className="pt-2 flex justify-end">
          <button
            type="button"
            disabled={isSearching}
            onClick={() => onLaunchMission(query, activeProfile.id)}
            className="flex items-center gap-2 px-8 py-3 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-500 hover:from-purple-500 hover:to-indigo-500 shadow-lg shadow-purple-600/30 transition-all cursor-pointer disabled:opacity-50"
          >
            {isSearching ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin text-white" />
                <span>Scanning Opportunities for {activeProfile.name}...</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-white" />
                <span>Launch AI Mission Control Scan</span>
              </>
            )}
          </button>
        </div>

      </div>

      {/* Scout Features Strip */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
        <div className="p-4 rounded-xl bg-[#0a0e1f]/80 border border-slate-800 space-y-1">
          <div className="flex items-center gap-2 text-purple-400 font-bold">
            <Bot className="w-4 h-4" />
            <span>Autonomous Web Crawl</span>
          </div>
          <p className="text-slate-400 text-[11px] leading-relaxed">
            Tavily web agents query Upwork, Reddit r/forhire, and curated boards in parallel for {activeProfile.targetRole}.
          </p>
        </div>

        <div className="p-4 rounded-xl bg-[#0a0e1f]/80 border border-slate-800 space-y-1">
          <div className="flex items-center gap-2 text-emerald-400 font-bold">
            <ShieldCheck className="w-4 h-4" />
            <span>15+ Scam Indicator Sentinel</span>
          </div>
          <p className="text-slate-400 text-[11px] leading-relaxed">
            Flags Telegram redirection, check advance lures, and unpaid trial exploitation.
          </p>
        </div>

        <div className="p-4 rounded-xl bg-[#0a0e1f]/80 border border-slate-800 space-y-1">
          <div className="flex items-center gap-2 text-cyan-400 font-bold">
            <Zap className="w-4 h-4" />
            <span>Portfolio Vector Matching</span>
          </div>
          <p className="text-slate-400 text-[11px] leading-relaxed">
            Embeds past work in Supabase pgvector to quote real metrics in generated pitches.
          </p>
        </div>
      </div>

    </div>
  );
}
