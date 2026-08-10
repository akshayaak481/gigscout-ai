'use client';

import React from 'react';
import { Bookmark, Sparkles, Briefcase, ExternalLink, ArrowRight, BookmarkCheck, Trash2 } from 'lucide-react';
import { Opportunity } from '@/types/opportunity';
import { OpportunityCard } from '@/components/opportunities/OpportunityCard';

interface SavedViewProps {
  opportunities: Opportunity[];
  onInspect: (opp: Opportunity) => void;
  onGeneratePitch: (opp: Opportunity) => void;
  onViewRiskReport: (opp: Opportunity) => void;
  onUnsave?: (opp: Opportunity) => void;
  onNavigateToOpportunities?: () => void;
}

export function SavedView({
  opportunities,
  onInspect,
  onGeneratePitch,
  onViewRiskReport,
  onUnsave,
  onNavigateToOpportunities,
}: SavedViewProps) {
  return (
    <div className="space-y-6 max-w-6xl mx-auto py-4">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-extrabold text-white tracking-tight">
              Saved &amp; Shortlisted Opportunities
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-purple-500/15 text-purple-300 border border-purple-500/30">
              {opportunities.length} Bookmarked
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Persisted in Supabase. Track your shortlisted client opportunities and active customized pitches.
          </p>
        </div>
      </div>

      {/* Grid or Empty State */}
      {opportunities.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {opportunities.map((opp) => (
            <div key={opp.id} className="relative group">
              <OpportunityCard
                opportunity={opp}
                onInspect={onInspect}
                onGeneratePitch={onGeneratePitch}
                onViewRiskReport={onViewRiskReport}
              />
              {onUnsave && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onUnsave(opp);
                  }}
                  className="absolute top-3 right-14 z-10 p-1.5 rounded-lg bg-slate-900/80 hover:bg-rose-950/80 text-slate-400 hover:text-rose-300 border border-slate-700 hover:border-rose-600/50 transition-all opacity-0 group-hover:opacity-100 cursor-pointer"
                  title="Remove from Saved"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="p-12 text-center rounded-2xl bg-[#0a0f20]/60 border border-slate-800 space-y-4 max-w-xl mx-auto my-8">
          <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/30 text-purple-400 flex items-center justify-center mx-auto shadow-inner">
            <Bookmark className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-white">
              No saved opportunities yet
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed max-w-md mx-auto">
              Explore discovered freelance postings in the Opportunities tab, click &ldquo;Inspect&rdquo;, and tap <strong className="text-purple-300">Save Opportunity</strong> to shortlist gigs to this dashboard.
            </p>
          </div>
          {onNavigateToOpportunities && (
            <button
              onClick={onNavigateToOpportunities}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-slate-950 bg-gradient-to-r from-purple-400 to-cyan-400 hover:from-purple-300 hover:to-cyan-300 transition-all shadow-md shadow-purple-500/20 cursor-pointer"
            >
              <Briefcase className="w-4 h-4 text-slate-950" />
              <span>Explore Opportunities</span>
            </button>
          )}
        </div>
      )}

    </div>
  );
}
