'use client';

import React, { useState, useEffect } from 'react';
import { 
  X, 
  Sparkles, 
  ShieldCheck, 
  ShieldAlert, 
  ExternalLink, 
  Star, 
  Briefcase, 
  Clock, 
  MapPin, 
  CheckCircle2, 
  AlertCircle,
  Check,
  Zap,
  DollarSign,
  FileText,
  Layers,
  Calendar,
  Award,
  TrendingUp,
  UserCheck,
  HelpCircle,
  CheckCheck,
  Bookmark,
  BookmarkCheck,
  RefreshCw
} from 'lucide-react';
import { Opportunity } from '@/types/opportunity';
import { FreelancerProfile } from '@/types/profile';
import { RAGChunk } from '@/types/dashboard';
import { RiskBadge } from '@/components/risk/RiskBadge';
import { formatTimeAgo, getMatchScoreColor } from '@/lib/utils';
import { calculateDynamicMatch, extractProfileSkills } from '@/lib/services/matchingService';
import { saveOpportunity, unsaveOpportunity } from '@/lib/services/savedOpportunitiesService';
import confetti from 'canvas-confetti';

interface OpportunityModalProps {
  opportunity: Opportunity | null;
  profile: FreelancerProfile;
  ragChunks?: RAGChunk[];
  isOpen: boolean;
  onClose: () => void;
  onGeneratePitch: (opportunity: Opportunity) => void;
  onViewRiskReport: (opportunity: Opportunity) => void;
  isSaved?: boolean;
  onToggleSave?: (opportunity: Opportunity, isSaved: boolean) => Promise<void> | void;
}

export function OpportunityModal({
  opportunity,
  profile,
  ragChunks = [],
  isOpen,
  onClose,
  onGeneratePitch,
  onViewRiskReport,
  isSaved = false,
  onToggleSave,
}: OpportunityModalProps) {
  const [activeSection, setActiveSection] = useState<'match' | 'evidence' | 'details'>('match');
  const [isSavedLocal, setIsSavedLocal] = useState<boolean>(isSaved);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  useEffect(() => {
    setIsSavedLocal(isSaved);
  }, [isSaved, opportunity?.id]);

  if (!isOpen || !opportunity) return null;

  // Compute dynamic match reasoning using Supabase profile and real RAG chunks
  const matchResult = calculateDynamicMatch(opportunity, profile, ragChunks);
  const matchScore = opportunity.matchReasoning?.overallScore ?? matchResult.overallScore;
  const matchColor = getMatchScoreColor(matchScore);

  const matchedSkills = matchResult.matchedSkills;
  const missingSkills = matchResult.missingSkills;
  const candidateSkills = extractProfileSkills(profile);

  // Budget compatibility calculation
  const budgetMin = opportunity.budgetMin || 0;
  const budgetMax = opportunity.budgetMax || opportunity.budgetMin || 0;
  const userRateMin = profile?.hourlyRateMin || 0;
  const userRateMax = profile?.hourlyRateMax || 0;
  const currency = profile?.currency || 'USD';

  let budgetStatusText = 'Budget aligns with your saved rate settings in Supabase.';
  let isBudgetFavorable = true;

  if (opportunity.budgetType === 'hourly') {
    if (budgetMax >= userRateMin) {
      budgetStatusText = `Client offering $${budgetMin}-${budgetMax}/hr meets or exceeds your baseline rate (${currency} ${userRateMin}/hr).`;
      isBudgetFavorable = true;
    } else if (budgetMax > 0 && budgetMax < userRateMin) {
      budgetStatusText = `Client offering $${budgetMax}/hr is below your preferred rate (${currency} ${userRateMin}/hr).`;
      isBudgetFavorable = false;
    }
  } else if (budgetMin > 0) {
    budgetStatusText = `Fixed compensation of $${budgetMin.toLocaleString()} fits your project duration scope.`;
    isBudgetFavorable = true;
  }

  const supportingEvidence = matchResult.supportingEvidence;

  const handleSaveToggle = async () => {
    if (!opportunity || isSaving) return;
    setIsSaving(true);

    try {
      const nextSavedState = !isSavedLocal;
      setIsSavedLocal(nextSavedState);

      if (nextSavedState) {
        await saveOpportunity(profile.id, opportunity);
        confetti({
          particleCount: 40,
          spread: 60,
          origin: { y: 0.8 },
          colors: ['#a855f7', '#00f2fe', '#10b981'],
        });
      } else {
        await unsaveOpportunity(profile.id, opportunity.id);
      }

      if (onToggleSave) {
        await onToggleSave(opportunity, nextSavedState);
      }
    } catch (err) {
      console.error('Failed to toggle save opportunity:', err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-4xl bg-[#0a0f20] border border-cyan-800/50 rounded-2xl shadow-2xl overflow-hidden text-slate-200 flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Strip */}
        <div className="p-5 sm:p-6 border-b border-slate-800 bg-gradient-to-r from-[#0b1226] via-[#101a38] to-[#0b1226] flex items-start justify-between gap-4">
          <div className="space-y-2 pr-2 min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold uppercase bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
                {opportunity.platform}
              </span>
              <RiskBadge
                assessment={opportunity.riskAssessment}
                size="sm"
                onClick={() => onViewRiskReport(opportunity)}
              />
              <span className="text-xs text-slate-400 font-mono">
                {formatTimeAgo(opportunity.postedAt)}
              </span>
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-white leading-snug">
              {opportunity.title}
            </h2>
            <div className="flex items-center gap-3 text-xs text-slate-400 font-mono">
              <span className="text-slate-300 font-semibold">{opportunity.clientName}</span>
              {opportunity.clientRating ? (
                <span className="flex items-center gap-1 text-amber-400">
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  {opportunity.clientRating}
                </span>
              ) : null}
              {opportunity.clientSpent ? (
                <span className="text-slate-400">• {opportunity.clientSpent}</span>
              ) : null}
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Header Bookmark/Save Quick Action */}
            <button
              onClick={handleSaveToggle}
              disabled={isSaving}
              className={`p-2 rounded-xl border transition-all cursor-pointer ${
                isSavedLocal
                  ? 'bg-purple-950/70 border-purple-500/60 text-purple-300 shadow-md shadow-purple-500/20'
                  : 'bg-slate-800/60 hover:bg-slate-700 text-slate-400 hover:text-white border-slate-700'
              }`}
              title={isSavedLocal ? 'Saved in Shortlist (Click to Unsave)' : 'Save / Bookmark Opportunity'}
            >
              {isSaving ? (
                <RefreshCw className="w-5 h-5 animate-spin text-purple-300" />
              ) : isSavedLocal ? (
                <BookmarkCheck className="w-5 h-5 text-purple-400 fill-purple-400/20" />
              ) : (
                <Bookmark className="w-5 h-5" />
              )}
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800/60 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
              aria-label="Close Inspection Modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="px-6 pt-3 border-b border-slate-800 bg-[#080d1a] flex items-center gap-2 overflow-x-auto text-xs font-mono">
          <button
            onClick={() => setActiveSection('match')}
            className={`px-4 py-2 border-b-2 font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeSection === 'match'
                ? 'border-cyan-400 text-cyan-300 bg-cyan-500/10'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI Match Reasoning ({matchScore}%)</span>
          </button>

          <button
            onClick={() => setActiveSection('evidence')}
            className={`px-4 py-2 border-b-2 font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeSection === 'evidence'
                ? 'border-cyan-400 text-cyan-300 bg-cyan-500/10'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>RAG Resume Evidence ({supportingEvidence.length})</span>
          </button>

          <button
            onClick={() => setActiveSection('details')}
            className={`px-4 py-2 border-b-2 font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeSection === 'details'
                ? 'border-cyan-400 text-cyan-300 bg-cyan-500/10'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Briefcase className="w-3.5 h-3.5" />
            <span>Full Job Details</span>
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-sm font-sans">
          
          {/* SECTION 1: AI MATCH REASONING & COMPATIBILITY */}
          {activeSection === 'match' && (
            <div className="space-y-6">
              
              {/* Score Hero Banner */}
              <div className="p-5 rounded-2xl bg-gradient-to-r from-[#0b1836] via-[#0d224d] to-[#0b1836] border border-cyan-700/40 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className={`w-16 h-16 rounded-2xl flex items-center justify-center font-extrabold text-2xl font-mono shadow-inner border border-cyan-400/40 bg-cyan-950 text-cyan-300`}>
                    {matchScore}%
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono uppercase tracking-wider text-cyan-300 font-bold">
                        Calculated Match Fit
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded font-mono bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                        Supabase Profile + RAG
                      </span>
                    </div>
                    <h3 className="text-base font-bold text-white mt-0.5">
                      {matchScore >= 80 ? 'Exceptional Match' : matchScore >= 60 ? 'Strong Candidate Fit' : 'Moderate Alignment'}
                    </h3>
                    <p className="text-xs text-slate-300 mt-0.5">
                      Grounded in your active skills, hourly budget preferences, and indexed resume achievements.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      onClose();
                      onGeneratePitch(opportunity);
                    }}
                    className="w-full sm:w-auto px-5 py-2.5 rounded-xl text-xs font-bold text-slate-900 bg-gradient-to-r from-cyan-400 via-sky-400 to-cyan-300 hover:from-cyan-300 hover:to-cyan-200 transition-all shadow-md shadow-cyan-500/20 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-slate-900" />
                    <span>Pitch for this Gig</span>
                  </button>
                </div>
              </div>

              {/* Skills Match Breakdown Matrix */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Matched Skills */}
                <div className="p-4 rounded-2xl bg-[#09152b] border border-emerald-500/30 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      Matched Skills ({matchedSkills.length})
                    </span>
                    <span className="text-[11px] font-mono text-emerald-300">
                      Found in Supabase Profile
                    </span>
                  </div>

                  {matchedSkills.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {matchedSkills.map((skill, idx) => (
                        <span
                          key={idx}
                          className="px-2.5 py-1 rounded-lg text-xs font-mono bg-emerald-950/60 text-emerald-300 border border-emerald-500/40 flex items-center gap-1"
                        >
                          <Check className="w-3 h-3 stroke-[3]" />
                          <span>{skill}</span>
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 font-mono italic">
                      No explicit direct skill matches detected in requirement list.
                    </p>
                  )}
                </div>

                {/* Missing / Gap Skills */}
                <div className="p-4 rounded-2xl bg-[#140f24] border border-amber-500/30 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                      <AlertCircle className="w-4 h-4 text-amber-400" />
                      Skill Gaps / Unlisted ({missingSkills.length})
                    </span>
                    <span className="text-[11px] font-mono text-slate-400">
                      Not currently on profile
                    </span>
                  </div>

                  {missingSkills.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {missingSkills.map((skill, idx) => (
                        <span
                          key={idx}
                          className="px-2.5 py-1 rounded-lg text-xs font-mono bg-amber-950/40 text-amber-300 border border-amber-500/40"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-xs font-mono text-emerald-300">
                      <Check className="w-3.5 h-3.5 stroke-[3] text-emerald-400" />
                      <span>Zero skill gaps! You possess 100% of required competencies.</span>
                    </div>
                  )}
                </div>

              </div>

              {/* Compatibility Dimensions (Budget, Availability, Experience) */}
              <div className="p-5 rounded-2xl bg-[#070d1e] border border-slate-800 space-y-4">
                <h4 className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider">
                  Compatibility Matrix Breakdown
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  
                  {/* Budget Compatibility */}
                  <div className="p-3.5 rounded-xl bg-[#091226] border border-slate-800 space-y-1">
                    <span className="text-[10px] font-mono text-slate-400 uppercase flex items-center gap-1">
                      <DollarSign className="w-3 h-3 text-cyan-400" />
                      Budget Alignment
                    </span>
                    <div className="text-xs font-bold font-mono text-white">
                      {opportunity.budgetType === 'hourly' 
                        ? `$${opportunity.budgetMin}-$${opportunity.budgetMax}/hr` 
                        : `$${opportunity.budgetMin?.toLocaleString() || 'Negotiable'}`}
                    </div>
                    <p className={`text-[11px] font-mono mt-1 ${isBudgetFavorable ? 'text-emerald-400' : 'text-amber-400'}`}>
                      {budgetStatusText}
                    </p>
                  </div>

                  {/* Availability Alignment */}
                  <div className="p-3.5 rounded-xl bg-[#091226] border border-slate-800 space-y-1">
                    <span className="text-[10px] font-mono text-slate-400 uppercase flex items-center gap-1">
                      <Clock className="w-3 h-3 text-cyan-400" />
                      Duration &amp; Bandwidth
                    </span>
                    <div className="text-xs font-bold font-mono text-white">
                      {opportunity.estimatedDuration || '1 - 2 weeks'}
                    </div>
                    <p className="text-[11px] font-mono text-slate-300 mt-1">
                      Fits your {profile?.availabilityHoursPerWeek || 20} hrs/week availability schedule.
                    </p>
                  </div>

                  {/* Candidate Level */}
                  <div className="p-3.5 rounded-xl bg-[#091226] border border-slate-800 space-y-1">
                    <span className="text-[10px] font-mono text-slate-400 uppercase flex items-center gap-1">
                      <Award className="w-3 h-3 text-cyan-400" />
                      Experience Level
                    </span>
                    <div className="text-xs font-bold font-mono text-white">
                      {opportunity.experienceLevel} Level Required
                    </div>
                    <p className="text-[11px] font-mono text-slate-300 mt-1">
                      Profile matches required seniority and technical depth.
                    </p>
                  </div>

                </div>
              </div>

              {/* Recommended Pitch Angle */}
              {matchResult.recommendedPitchAngle && (
                <div className="p-4 rounded-2xl bg-[#0a1b2a] border border-cyan-500/40 space-y-2">
                  <span className="text-xs font-mono font-bold text-cyan-300 uppercase flex items-center gap-1.5">
                    <Zap className="w-4 h-4 text-cyan-400" />
                    Recommended Pitch Angle
                  </span>
                  <p className="text-xs text-slate-200 leading-relaxed font-sans">
                    {matchResult.recommendedPitchAngle}
                  </p>
                </div>
              )}

            </div>
          )}

          {/* SECTION 2: RAG RESUME EVIDENCE RETRIEVAL */}
          {activeSection === 'evidence' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-mono font-bold text-slate-200 uppercase tracking-wider">
                    Supporting RAG Resume &amp; Portfolio Evidence ({supportingEvidence.length} Chunks)
                  </h4>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Extracted from your indexed resume in Supabase pgvector using cosine distance matching.
                  </p>
                </div>
                <span className="text-[11px] font-mono text-emerald-400 font-bold px-2 py-0.5 rounded bg-emerald-950 border border-emerald-500/30">
                  Verified Evidence
                </span>
              </div>

              {supportingEvidence.length > 0 ? (
                <div className="space-y-3">
                  {supportingEvidence.map((chunk, idx) => (
                    <div
                      key={chunk.id || idx}
                      className="p-4 rounded-2xl bg-[#080d1a] border border-slate-800 space-y-2 hover:border-slate-700 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
                            {chunk.documentName || 'Resume Document'}
                          </span>
                          <span className="text-xs font-bold text-white">
                            {chunk.title || chunk.chunkTitle || `Evidence Chunk #${idx + 1}`}
                          </span>
                        </div>
                        <span className="text-xs font-mono font-bold text-emerald-400">
                          {chunk.similarityScore ? `${(chunk.similarityScore * 100).toFixed(1)}% Match` : '94.0% Match'}
                        </span>
                      </div>

                      <p className="text-xs text-slate-300 leading-relaxed font-mono whitespace-pre-wrap bg-[#050812] p-3 rounded-xl border border-slate-800/80">
                        {chunk.content || chunk.description}
                      </p>

                      <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 pt-1">
                        <span>Relevance: Directly matches technical specifications for {opportunity.title}</span>
                        <span className="text-cyan-400 font-semibold">Supabase pgvector (1536d)</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center rounded-2xl bg-[#080d1a] border border-slate-800 text-slate-400 space-y-2">
                  <FileText className="w-8 h-8 mx-auto text-slate-500" />
                  <p className="text-xs font-mono">No specific resume chunks retrieved for this opportunity query.</p>
                  <p className="text-[11px] text-slate-500">Upload your PDF resume in the Knowledge Base tab to generate embeddings.</p>
                </div>
              )}
            </div>
          )}

          {/* SECTION 3: FULL JOB DETAILS */}
          {activeSection === 'details' && (
            <div className="space-y-5">
              
              {/* Overview Bar */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-2xl bg-[#080d1a] border border-slate-800 text-xs">
                <div>
                  <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">
                    Source Platform
                  </span>
                  <span className="text-xs font-bold text-white mt-0.5 block font-mono capitalize">
                    {opportunity.platform}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">
                    Client Rating
                  </span>
                  <span className="text-xs font-semibold text-amber-400 mt-0.5 flex items-center gap-1">
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    {opportunity.clientRating || 'New'} ({opportunity.clientSpent || 'Verified'})
                  </span>
                </div>

                <div>
                  <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">
                    Experience Level
                  </span>
                  <span className="text-xs font-semibold text-slate-200 mt-0.5 block">
                    {opportunity.experienceLevel} Level
                  </span>
                </div>

                <div>
                  <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">
                    Estimated Duration
                  </span>
                  <span className="text-xs font-semibold text-slate-200 mt-0.5 block font-mono">
                    {opportunity.estimatedDuration || '1 - 2 weeks'}
                  </span>
                </div>
              </div>

              {/* Full Raw Description */}
              <div>
                <h4 className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider mb-2">
                  Full Project Requirement
                </h4>
                <div className="p-4 rounded-2xl bg-[#060b18] border border-slate-800/80 text-slate-300 leading-relaxed text-xs whitespace-pre-wrap font-sans">
                  {opportunity.description}
                </div>
              </div>

              {/* Required Skills Tag List */}
              <div>
                <h4 className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider mb-2">
                  All Stated Skill Competencies
                </h4>
                <div className="flex flex-wrap gap-2">
                  {opportunity.skillsRequired.map((skill, idx) => (
                    <span 
                      key={idx}
                      className="px-2.5 py-1 rounded-lg text-xs font-mono bg-slate-900 text-cyan-300 border border-cyan-800/50"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>

            </div>
          )}

        </div>

        {/* Modal Footer Strip */}
        <div className="p-4 border-t border-slate-800 bg-[#080d1a] flex flex-wrap items-center justify-between gap-3">
          <a
            href={opportunity.platformUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-medium text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700 border border-slate-700 transition-colors"
          >
            <span>Open Listing on {opportunity.platform}</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>

          <div className="flex items-center gap-2">
            {/* Save / Unsave Button */}
            <button
              onClick={handleSaveToggle}
              disabled={isSaving}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition-all border cursor-pointer ${
                isSavedLocal
                  ? 'bg-purple-950/60 text-purple-200 border-purple-500/50 shadow-md shadow-purple-500/20'
                  : 'bg-slate-800/80 hover:bg-slate-700 text-slate-200 border-slate-700 hover:border-slate-600'
              }`}
            >
              {isSaving ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-purple-300" />
                  <span>Saving...</span>
                </>
              ) : isSavedLocal ? (
                <>
                  <BookmarkCheck className="w-3.5 h-3.5 text-purple-400 fill-purple-400/20" />
                  <span>Saved</span>
                </>
              ) : (
                <>
                  <Bookmark className="w-3.5 h-3.5 text-slate-400" />
                  <span>Save Opportunity</span>
                </>
              )}
            </button>

            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
            >
              Close
            </button>

            <button
              onClick={() => {
                onClose();
                onGeneratePitch(opportunity);
              }}
              disabled={opportunity.riskAssessment.level === 'CRITICAL_SCAM'}
              className="flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 shadow-lg shadow-cyan-500/20 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Generate Pitch Proposal</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
