'use client';

import React, { useState } from 'react';
import { 
  Search, 
  Filter, 
  ShieldCheck, 
  Sparkles, 
  SlidersHorizontal,
  Layers,
  CheckCircle2,
  AlertTriangle,
  FilePlus2,
  ArrowRight,
  Send,
  X
} from 'lucide-react';
import { Opportunity, PlatformType, RiskLevel } from '@/types/opportunity';
import { FreelancerProfile } from '@/types/profile';
import { RAGChunk } from '@/types/dashboard';
import { OpportunityCard } from './OpportunityCard';
import { parseRawJobToOpportunity, calculateDynamicMatch } from '@/lib/services/matchingService';

interface OpportunityListProps {
  opportunities: Opportunity[];
  onInspect: (opportunity: Opportunity) => void;
  onGeneratePitch: (opportunity: Opportunity) => void;
  onViewRiskReport: (opportunity: Opportunity) => void;
  activeProfile?: FreelancerProfile;
  ragChunks?: RAGChunk[];
  onAddCustomOpportunity?: (opportunity: Opportunity) => void;
}

export function OpportunityList({
  opportunities,
  onInspect,
  onGeneratePitch,
  onViewRiskReport,
  activeProfile,
  ragChunks = [],
  onAddCustomOpportunity,
}: OpportunityListProps) {
  const [platformFilter, setPlatformFilter] = useState<PlatformType | 'all'>('all');
  const [riskFilter, setRiskFilter] = useState<RiskLevel | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [minMatch, setMinMatch] = useState<number>(0);

  // Analyze My Job state
  const [isAnalyzeOpen, setIsAnalyzeOpen] = useState<boolean>(false);
  const [rawJobText, setRawJobText] = useState<string>('');
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);

  const handleAnalyzeJobSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rawJobText.trim()) return;

    setIsAnalyzing(true);

    try {
      const fallbackProfile: FreelancerProfile = activeProfile || {
        id: 'prof-active',
        name: 'Freelancer',
        title: 'Freelance Professional',
        bio: '',
        targetRole: 'Freelance Professional',
        hourlyRateMin: 50,
        hourlyRateMax: 90,
        currency: 'USD',
        availabilityHoursPerWeek: 20,
        experienceYears: 3,
        preferredPlatforms: ['upwork', 'weworkremotely', 'reddit'],
        locationPreference: 'Remote',
        projectDuration: '1 - 2 weeks',
        skills: [],
        portfolioItems: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Parse pasted job into an Opportunity object
      const parsedOpp = parseRawJobToOpportunity(rawJobText, fallbackProfile);

      // Calculate dynamic match reasoning against Supabase profile & RAG resume
      const matchResult = calculateDynamicMatch(parsedOpp, fallbackProfile, ragChunks);

      parsedOpp.matchReasoning = {
        overallScore: matchResult.overallScore,
        skillsMatchScore: matchResult.skillsMatchScore,
        rateAlignmentScore: matchResult.rateAlignmentScore,
        experienceMatchScore: matchResult.experienceMatchScore,
        whyGoodMatch: matchResult.whyGoodMatch,
        potentialGaps: matchResult.potentialGaps,
        recommendedPitchAngle: matchResult.recommendedPitchAngle,
        relevantPortfolioIds: [],
      };

      if (onAddCustomOpportunity) {
        onAddCustomOpportunity(parsedOpp);
      }

      // Immediately inspect the analyzed opportunity
      onInspect(parsedOpp);
      setRawJobText('');
      setIsAnalyzeOpen(false);
    } catch (err) {
      console.error('Job analysis error:', err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const filteredOpportunities = opportunities
    .filter((opp) => {
      // Platform match
      if (platformFilter !== 'all' && opp.platform !== platformFilter) return false;
      
      // Risk level filter
      if (riskFilter !== 'all' && opp.riskAssessment.level !== riskFilter) return false;

      // Minimum match score filter
      if (opp.matchReasoning && opp.matchReasoning.overallScore < minMatch) return false;

      // Text search query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const inTitle = opp.title.toLowerCase().includes(q);
        const inDesc = opp.description.toLowerCase().includes(q);
        const inSkills = opp.skillsRequired.some(s => s.toLowerCase().includes(q));
        const inClient = opp.clientName.toLowerCase().includes(q);
        if (!inTitle && !inDesc && !inSkills && !inClient) return false;
      }

      return true;
    })
    .sort((a, b) => {
      const scoreA = a.matchReasoning?.overallScore ?? (100 - (a.riskAssessment?.score || 0));
      const scoreB = b.matchReasoning?.overallScore ?? (100 - (b.riskAssessment?.score || 0));
      return scoreB - scoreA;
    });

  return (
    <section className="space-y-6">
      
      {/* Section Header & Search / Actions Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-white tracking-tight">
              Discovered Opportunities &amp; Match Explorer
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
              {filteredOpportunities.length} Found
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Real-time multi-platform crawl parsed by Risk Sentinel &amp; RAG Matcher.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Analyze My Job Toggle Button */}
          <button
            onClick={() => setIsAnalyzeOpen(!isAnalyzeOpen)}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold font-mono bg-gradient-to-r from-cyan-500/20 via-sky-500/20 to-blue-500/20 hover:from-cyan-500/30 hover:to-blue-500/30 text-cyan-300 border border-cyan-500/40 shadow-sm transition-all cursor-pointer"
          >
            <FilePlus2 className="w-4 h-4 text-cyan-400" />
            <span>{isAnalyzeOpen ? 'Close Analyze Input' : 'Analyze My Job'}</span>
          </button>

          {/* Search Input */}
          <div className="relative w-full md:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter by keyword, skill, client..."
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-[#0a0f20] border border-slate-800 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500/60 transition-all font-mono"
            />
          </div>
        </div>
      </div>

      {/* "Analyze My Job" Input Drawer */}
      {isAnalyzeOpen && (
        <form
          onSubmit={handleAnalyzeJobSubmit}
          className="p-5 rounded-2xl bg-gradient-to-br from-[#0c152a] via-[#0e1c3a] to-[#0a1122] border border-cyan-500/40 shadow-xl space-y-4 animate-in fade-in slide-in-from-top-2 duration-200"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">
                  Analyze Custom Job Requirement
                </h3>
                <p className="text-xs text-slate-300">
                  Paste any job description to calculate instant match scores against your saved Supabase profile &amp; RAG resume.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsAnalyzeOpen(false)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white bg-slate-800/60 hover:bg-slate-700 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-2">
            <textarea
              value={rawJobText}
              onChange={(e) => setRawJobText(e.target.value)}
              placeholder={`Paste the job description here...\nExample:\n"Looking for a Generative AI & Cloud Engineer to build an Agentic RAG pipeline using LangGraph, Python, Databricks, Snowflake, and Azure. Budget: $70 - $90/hr. 2 weeks duration."`}
              rows={4}
              required
              className="w-full p-3.5 rounded-xl bg-[#060b18] border border-cyan-900/60 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-400 font-mono leading-relaxed resize-y"
            />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
            <span className="text-[11px] text-slate-400 font-mono">
              Evaluates: Normalized skills, rate alignment, weekly bandwidth &amp; Supabase pgvector resume citations.
            </span>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setRawJobText('')}
                className="px-3 py-1.5 rounded-lg text-xs font-mono text-slate-400 hover:text-white bg-slate-800/50 hover:bg-slate-700 transition-colors"
              >
                Clear
              </button>
              <button
                type="submit"
                disabled={isAnalyzing || !rawJobText.trim()}
                className="flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold font-mono text-slate-950 bg-gradient-to-r from-cyan-400 via-sky-300 to-cyan-300 hover:from-cyan-300 hover:to-cyan-200 transition-all shadow-md shadow-cyan-500/20 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 fill-slate-950" />
                <span>{isAnalyzing ? 'Calculating Match...' : 'Calculate AI Match & Inspect'}</span>
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Filter Tabs Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-2xl bg-[#0a0f20]/90 border border-slate-800/80 text-xs">
        
        {/* Platform Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          <span className="text-slate-500 font-mono text-[11px] mr-1 hidden sm:inline">
            Platform:
          </span>
          {[
            { id: 'all', label: 'All Feeds' },
            { id: 'upwork', label: 'Upwork' },
            { id: 'weworkremotely', label: 'WeWorkRemotely' },
            { id: 'reddit', label: 'Reddit' },
            { id: 'freelancer', label: 'Freelancer' },
            { id: 'direct', label: 'Direct / Custom' },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setPlatformFilter(item.id as typeof platformFilter)}
              className={`px-3 py-1.5 rounded-lg font-mono text-xs font-medium transition-all ${
                platformFilter === item.id
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 shadow-sm'
                  : 'bg-slate-900/60 text-slate-400 hover:text-slate-200 border border-transparent'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* Risk Filter */}
        <div className="flex items-center gap-1.5">
          <span className="text-slate-500 font-mono text-[11px] mr-1 hidden sm:inline">
            Risk:
          </span>
          {[
            { id: 'all', label: 'All Risks' },
            { id: 'VERIFIED_SAFE', label: 'Safe Only' },
            { id: 'CRITICAL_SCAM', label: 'Scam Alerts' },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setRiskFilter(item.id as typeof riskFilter)}
              className={`px-2.5 py-1.5 rounded-lg font-mono text-[11px] font-medium transition-all ${
                riskFilter === item.id
                  ? 'bg-slate-800 text-white border border-slate-700'
                  : 'bg-slate-900/40 text-slate-400 hover:text-slate-200 border border-transparent'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

      </div>

      {/* Grid of Opportunity Cards */}
      {filteredOpportunities.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredOpportunities.map((opp) => (
            <OpportunityCard
              key={opp.id}
              opportunity={opp}
              onInspect={onInspect}
              onGeneratePitch={onGeneratePitch}
              onViewRiskReport={onViewRiskReport}
            />
          ))}
        </div>
      ) : (
        <div className="p-12 text-center rounded-2xl bg-[#0a0f20]/60 border border-slate-800 space-y-3">
          <SlidersHorizontal className="w-8 h-8 text-slate-500 mx-auto" />
          <h3 className="text-sm font-bold text-slate-300">No matching opportunities found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Try adjusting your search query, clearing filters, or pasting a custom job description with &ldquo;Analyze My Job&rdquo; above.
          </p>
          <button
            onClick={() => {
              setPlatformFilter('all');
              setRiskFilter('all');
              setSearchQuery('');
            }}
            className="px-3 py-1.5 rounded-lg text-xs font-mono bg-slate-800 text-cyan-300 border border-slate-700 cursor-pointer"
          >
            Reset Filters
          </button>
        </div>
      )}

    </section>
  );
}
