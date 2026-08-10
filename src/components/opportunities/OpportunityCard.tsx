'use client';

import React from 'react';
import { 
  DollarSign, 
  Clock, 
  MapPin, 
  Star, 
  Sparkles, 
  ShieldAlert, 
  ArrowUpRight, 
  ExternalLink,
  Zap,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import { Opportunity } from '@/types/opportunity';
import { RiskBadge } from '@/components/risk/RiskBadge';
import { formatTimeAgo, getMatchScoreColor } from '@/lib/utils';

interface OpportunityCardProps {
  opportunity: Opportunity;
  onInspect: (opportunity: Opportunity) => void;
  onGeneratePitch: (opportunity: Opportunity) => void;
  onViewRiskReport: (opportunity: Opportunity) => void;
}

export function OpportunityCard({
  opportunity,
  onInspect,
  onGeneratePitch,
  onViewRiskReport,
}: OpportunityCardProps) {
  const match = opportunity.matchReasoning;
  const matchColor = getMatchScoreColor(match?.overallScore || 50);
  const isHighRisk = opportunity.riskAssessment.level === 'CRITICAL_SCAM' || opportunity.riskAssessment.level === 'MODERATE_RISK';

  const getPlatformBadge = (platform: Opportunity['platform']) => {
    switch (platform) {
      case 'upwork':
        return { label: 'Upwork', color: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30' };
      case 'weworkremotely':
        return { label: 'WeWorkRemotely', color: 'bg-indigo-500/10 text-indigo-300 border-indigo-500/30' };
      case 'reddit':
        return { label: 'Reddit r/forhire', color: 'bg-orange-500/10 text-orange-300 border-orange-500/30' };
      case 'freelancer':
        return { label: 'Freelancer', color: 'bg-blue-500/10 text-blue-300 border-blue-500/30' };
      default:
        return { label: 'Direct Client', color: 'bg-cyan-500/10 text-cyan-300 border-cyan-500/30' };
    }
  };

  const platformInfo = getPlatformBadge(opportunity.platform);

  return (
    <div className={`relative group rounded-2xl border transition-all duration-300 flex flex-col justify-between overflow-hidden ${
      isHighRisk 
        ? 'bg-[#120810]/70 border-rose-900/40 hover:border-rose-700/60 shadow-lg shadow-rose-950/20' 
        : 'bg-[#0a0f20]/80 border-slate-800/80 hover:border-cyan-500/40 hover:shadow-xl hover:shadow-cyan-500/10 backdrop-blur-xl'
    }`}>
      
      {/* Top Header Strip: Platform & Match % / Risk Badge */}
      <div className="p-5 pb-3">
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-mono font-medium border ${platformInfo.color}`}>
              {platformInfo.label}
            </span>
            <span className="text-[11px] text-slate-400 font-mono">
              {formatTimeAgo(opportunity.postedAt)}
            </span>
          </div>

          {/* Risk Badge Button */}
          <RiskBadge
            assessment={opportunity.riskAssessment}
            size="sm"
            onClick={() => onViewRiskReport(opportunity)}
          />
        </div>

        {/* Opportunity Title & Client Line */}
        <h3 
          onClick={() => onInspect(opportunity)}
          className="text-base font-bold text-white group-hover:text-cyan-300 transition-colors line-clamp-2 cursor-pointer"
        >
          {opportunity.title}
        </h3>

        <div className="flex items-center gap-2 text-xs text-slate-400 mt-2 font-mono">
          <span className="text-slate-300 truncate max-w-[180px]">{opportunity.clientName}</span>
          {opportunity.clientRating ? (
            <span className="flex items-center gap-1 text-amber-400">
              <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
              {opportunity.clientRating}
            </span>
          ) : null}
          {opportunity.clientSpent ? (
            <span className="text-slate-500 hidden sm:inline">• {opportunity.clientSpent}</span>
          ) : null}
        </div>

        {/* Short Description */}
        <p className="text-xs text-slate-300 mt-3 line-clamp-3 leading-relaxed">
          {opportunity.description}
        </p>
      </div>

      {/* Skills Required Chips */}
      <div className="px-5 py-2">
        <div className="flex flex-wrap gap-1.5">
          {opportunity.skillsRequired.slice(0, 4).map((skill, idx) => (
            <span 
              key={idx}
              className="px-2 py-0.5 rounded-md text-[10px] font-mono bg-slate-900/90 text-cyan-300 border border-cyan-900/40"
            >
              {skill}
            </span>
          ))}
          {opportunity.skillsRequired.length > 4 && (
            <span className="px-1.5 py-0.5 rounded text-[10px] font-mono text-slate-500">
              +{opportunity.skillsRequired.length - 4} more
            </span>
          )}
        </div>
      </div>

      {/* Footer: Budget, Match Score, & Quick Actions */}
      <div className="p-5 pt-3 border-t border-slate-800/80 bg-slate-950/40 mt-3 flex items-center justify-between gap-3">
        
        {/* Budget */}
        <div>
          <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">
            {opportunity.budgetType === 'hourly' ? 'Hourly Rate' : 'Fixed Price'}
          </div>
          <div className="text-sm font-bold text-white font-mono flex items-center gap-1">
            {opportunity.budgetType === 'hourly' ? (
              <span>${opportunity.budgetMin} - ${opportunity.budgetMax}/hr</span>
            ) : (
              <span>${opportunity.budgetMin?.toLocaleString()}</span>
            )}
          </div>
        </div>

        {/* Match Percentage or Scam Flag */}
        {match && (
          <div className="flex items-center gap-2">
            <div className="text-right">
              <div className="text-[10px] font-mono text-slate-400 uppercase">
                AI Match
              </div>
              <div className={`text-sm font-extrabold font-mono ${matchColor.text}`}>
                {match.overallScore}%
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => onInspect(opportunity)}
            className="px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white transition-colors border border-slate-700/80"
            title="Inspect Match Reasoning & Risk"
          >
            Inspect
          </button>
          
          <button
            onClick={() => onGeneratePitch(opportunity)}
            disabled={opportunity.riskAssessment.level === 'CRITICAL_SCAM'}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
              opportunity.riskAssessment.level === 'CRITICAL_SCAM'
                ? 'bg-slate-800 text-slate-500 cursor-not-allowed opacity-50'
                : 'bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white shadow-md shadow-cyan-500/20'
            }`}
            title={opportunity.riskAssessment.level === 'CRITICAL_SCAM' ? 'Blocked: High Risk Scam' : 'Generate Tailored Pitch'}
          >
            <Sparkles className="w-3 h-3" />
            <span>Pitch</span>
          </button>
        </div>

      </div>

    </div>
  );
}
