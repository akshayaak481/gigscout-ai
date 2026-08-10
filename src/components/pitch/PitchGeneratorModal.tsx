'use client';

import React, { useState, useEffect } from 'react';
import { 
  X, 
  Sparkles, 
  Copy, 
  Check, 
  Bot, 
  Briefcase, 
  DollarSign, 
  Clock, 
  Layers,
  ArrowRight,
  RefreshCw,
  FileText,
  AlertCircle
} from 'lucide-react';
import { Opportunity } from '@/types/opportunity';
import { FreelancerProfile } from '@/types/profile';
import { RAGChunk } from '@/types/dashboard';
import { extractProfileSkills, isSkillMatch } from '@/lib/services/matchingService';
import confetti from 'canvas-confetti';

interface PitchGeneratorModalProps {
  opportunity: Opportunity | null;
  profile: FreelancerProfile;
  ragChunks?: RAGChunk[];
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Extracts natural, complete accomplishment sentences from RAG chunks
 * without raw chunk headers, filenames, or midway word truncations.
 */
function extractNaturalAccomplishments(
  ragChunks: RAGChunk[],
  profile: FreelancerProfile,
  opportunity: Opportunity
): string[] {
  const accomplishments: string[] = [];
  const requiredSkills = opportunity.skillsRequired || [];
  const candidateSkills = extractProfileSkills(profile);

  // 1. Scan real RAG chunks from Supabase
  for (const chunk of ragChunks || []) {
    const raw = (chunk.content || chunk.description || '').trim();
    if (!raw) continue;

    // Split on complete sentences and bullet boundaries
    const rawSentences = raw
      .replace(/\r/g, '')
      .split(/(?<=[.!?])\s+|\n+/g)
      .map((s) => s.trim().replace(/^[-–—•*#\d.]+\s*/, '').trim())
      .filter((s) => {
        if (s.length < 30 || s.length > 260) return false;
        const lower = s.toLowerCase();
        if (lower.includes('.pdf') || lower.includes('part ') || lower.includes('page ') || lower.startsWith('resume')) return false;
        return true;
      });

    for (const sentence of rawSentences) {
      const clean = sentence.replace(/[,;:]+$/, '').trim();
      const punctuated = /[.!?]$/.test(clean) ? clean : `${clean}.`;

      const lower = punctuated.toLowerCase();
      const hasSkillMatch = requiredSkills.some((sk) => lower.includes(sk.toLowerCase())) ||
                            candidateSkills.some((sk) => lower.includes(sk.toLowerCase()));

      if (hasSkillMatch && !accomplishments.includes(punctuated)) {
        accomplishments.push(punctuated);
        if (accomplishments.length >= 2) break;
      }
    }
    if (accomplishments.length >= 2) break;
  }

  // 2. Fallback to real profile portfolio items if no sentence matched
  if (accomplishments.length === 0 && profile.portfolioItems && profile.portfolioItems.length > 0) {
    for (const item of profile.portfolioItems) {
      const desc = (item.description || item.metricsOrOutcome || '').trim();
      if (desc) {
        const text = `${item.title}: ${desc}`;
        const punctuated = text.endsWith('.') ? text : `${text}.`;
        accomplishments.push(punctuated);
        if (accomplishments.length >= 2) break;
      }
    }
  }

  return accomplishments;
}

export function PitchGeneratorModal({
  opportunity,
  profile,
  ragChunks = [],
  isOpen,
  onClose,
}: PitchGeneratorModalProps) {
  const [tone, setTone] = useState<'consultative' | 'professional' | 'bold_creator' | 'concise'>('consultative');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [pitchText, setPitchText] = useState<string>('');

  // 1. Determine if valid freelancer profile exists in Supabase
  const candidateSkills = extractProfileSkills(profile);
  const hasProfileData = Boolean(
    profile && (profile.name?.trim() || profile.targetRole?.trim() || candidateSkills.length > 0)
  );

  const requiredSkills = opportunity?.skillsRequired || [];
  
  // Identify which required skills the candidate actually has in their profile
  const verifiedMatchedSkills = requiredSkills.filter((req) =>
    candidateSkills.some((cand) => isSkillMatch(cand, req))
  );

  // Skill phrase: ONLY claims skills that exist in candidate's profile
  const skillClaim = verifiedMatchedSkills.length > 0
    ? verifiedMatchedSkills.slice(0, 4).join(', ')
    : candidateSkills.length > 0
      ? candidateSkills.slice(0, 3).join(', ')
      : (profile?.targetRole || '');

  // 2. Extract natural accomplishment evidence
  const naturalAccomplishments = opportunity 
    ? extractNaturalAccomplishments(ragChunks, profile, opportunity)
    : [];

  // 3. Candidate metadata strictly from Supabase profile
  const candidateName = profile?.name?.trim() || 'Freelance Specialist';
  const candidateRole = profile?.targetRole?.trim() || 'AI & Data Engineering Freelancer';
  const currency = profile?.currency || 'USD';
  const minRate = profile?.hourlyRateMin || 0;
  const maxRate = profile?.hourlyRateMax || 0;

  const rateText = minRate > 0
    ? (maxRate > minRate ? `${currency} ${minRate} - ${maxRate}/hr` : `${currency} ${minRate}/hr`)
    : opportunity?.budgetMin
      ? (opportunity.budgetType === 'hourly' ? `$${opportunity.budgetMin}-${opportunity.budgetMax || opportunity.budgetMin}/hr` : `$${opportunity.budgetMin.toLocaleString()} (fixed)`)
      : null;

  const hoursPerWeek = profile?.availabilityHoursPerWeek || 0;
  const locationPref = profile?.locationPreference || 'Remote';
  const hasTimeline = Boolean(opportunity?.estimatedDuration && opportunity.estimatedDuration.trim());
  const timelineText = opportunity?.estimatedDuration?.trim() || '';

  // Build the personalized, natural proposal
  const generateProposal = (selectedTone: typeof tone): string => {
    if (!opportunity) return '';

    if (!hasProfileData) {
      return `[Error: No saved freelancer profile found in Supabase]\n\nPlease navigate to "My Profile" and save your real name, target role, and technical skills before generating proposals. Demo and fallback data are disabled.`;
    }

    const techFitPhrase = skillClaim ? `in ${skillClaim}` : 'in this domain';
    const clientGreeting = opportunity.clientName?.trim() || 'there';

    // Evidence block formatted naturally
    const evidenceLines = naturalAccomplishments.length > 0
      ? naturalAccomplishments.map((acc) => `• ${acc}`).join('\n')
      : `• Hands-on track record delivering production-grade solutions ${techFitPhrase}.`;

    // Commercial and terms lines
    const termsList: string[] = [];
    if (rateText) {
      termsList.push(`• Rate: ${rateText}`);
    }
    if (hoursPerWeek > 0) {
      termsList.push(`• Availability: ${hoursPerWeek} hrs/week (${locationPref})`);
    } else if (locationPref) {
      termsList.push(`• Location: ${locationPref}`);
    }
    if (hasTimeline) {
      termsList.push(`• Timeline: Aligned with your target completion in ${timelineText}`);
    }
    const termsBlock = termsList.join('\n');

    if (selectedTone === 'concise') {
      return `Hi ${clientGreeting},

I saw your posting for "${opportunity.title}" and wanted to connect as my technical focus ${techFitPhrase} directly matches your requirements.

Relevant Experience:
${evidenceLines}

Engagement Details:
${termsBlock}

Are you available for a brief 10-minute kickoff discussion this week to discuss next steps?

Best regards,
${candidateName}
${candidateRole}`;
    }

    if (selectedTone === 'professional') {
      return `Dear ${opportunity.clientName ? opportunity.clientName : 'Hiring Team'},

I am writing to submit my proposal for your project: "${opportunity.title}".

Having reviewed your stated requirements, my technical capabilities ${techFitPhrase} align directly with your project scope.

Key Qualifications & Practical Evidence:
${evidenceLines}

Proposed Engagement Terms:
${termsBlock}

I focus on clean architecture, comprehensive test coverage, and transparent milestone delivery. Thank you for your consideration, and I look forward to discussing the technical scope with you.

Sincerely,
${candidateName}
${candidateRole}`;
    }

    if (selectedTone === 'bold_creator') {
      return `Hey ${clientGreeting},

Your project "${opportunity.title}" is right in line with what I build every day. Here is what I bring to the table:

Proof of Execution:
${evidenceLines}

Key Commercials:
${termsBlock}

Having hands-on experience ${techFitPhrase} means we can hit the ground running with zero ramp-up friction. Let's connect for a brief call to align on scope and get this built.

Cheers,
${candidateName}
${candidateRole}`;
    }

    // Default: Consultative
    return `Hello ${opportunity.clientName ? opportunity.clientName : 'Hiring Team'},

I am writing regarding your listing for "${opportunity.title}". Having reviewed your project description, your core requirements ${techFitPhrase} align directly with my background.

Why I can deliver immediate value:
${evidenceLines}

Engagement Overview:
${termsBlock}

I recommend structuring this assignment into transparent milestones with regular staging demos so you have clear progress visibility.

I would welcome the opportunity to discuss your technical architecture in more detail. Looking forward to collaborating!

Warm regards,
${candidateName}
${candidateRole}`;
  };

  // Generate on open or tone change
  useEffect(() => {
    if (isOpen && opportunity) {
      setPitchText(generateProposal(tone));
    }
  }, [isOpen, opportunity, tone, profile, ragChunks]);

  if (!isOpen || !opportunity) return null;

  const handleCopy = () => {
    if (!hasProfileData) return;
    navigator.clipboard.writeText(pitchText);
    setCopied(true);
    confetti({
      particleCount: 40,
      spread: 60,
      origin: { y: 0.7 },
      colors: ['#00f2fe', '#4facfe', '#8b5cf6'],
    });
    setTimeout(() => setCopied(false), 2500);
  };

  const handleRegenerate = () => {
    setIsGenerating(true);
    setTimeout(() => {
      setPitchText(generateProposal(tone));
      setIsGenerating(false);
    }, 200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-3xl bg-[#0a0f20] border border-cyan-700/50 rounded-2xl shadow-2xl overflow-hidden text-slate-200 flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-slate-800 bg-gradient-to-r from-[#0b1226] via-[#101a38] to-[#0b1226] flex items-start justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-3 rounded-xl bg-gradient-to-br from-cyan-500 to-violet-600 shadow-lg shadow-cyan-500/20 text-slate-950 font-bold shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono uppercase tracking-widest text-cyan-400 font-bold">
                  AI Proposal Crafter
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full font-mono bg-violet-500/20 text-violet-300 border border-violet-500/30">
                  Supabase &amp; RAG Grounded
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-bold text-white mt-0.5 truncate">
                Proposal for &quot;{opportunity.title}&quot;
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800/60 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors shrink-0 cursor-pointer"
            aria-label="Close Proposal Modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-5 text-sm">
          
          {/* Missing Profile Warning Card */}
          {!hasProfileData && (
            <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-500/50 flex items-start gap-3 text-rose-200">
              <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
              <div className="text-xs space-y-1">
                <strong className="text-rose-300 block font-bold">Profile Unavailable in Supabase</strong>
                <p>
                  No active freelancer profile or skills found in Supabase. Please save your profile in &quot;My Profile&quot; before generating proposals. Hardcoded/demo data fallbacks have been removed.
                </p>
              </div>
            </div>
          )}

          {/* Missing RAG Chunks Notice */}
          {hasProfileData && (!ragChunks || ragChunks.length === 0) && (
            <div className="p-3 rounded-xl bg-amber-950/30 border border-amber-500/30 flex items-start gap-2.5 text-amber-200">
              <FileText className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <p className="text-[11px]">
                <strong className="text-amber-300">RAG Evidence Note:</strong> No vectorized resume chunks found in Supabase yet. Upload your resume in the Knowledge Base to cite verified projects automatically.
              </p>
            </div>
          )}

          {/* Tone Selector & Proof Points */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* Tone Selector */}
            <div className="p-3.5 rounded-xl bg-[#070d1c] border border-slate-800">
              <label className="text-xs font-mono text-slate-400 uppercase tracking-wider block mb-2 font-bold">
                Proposal Tone &amp; Style
              </label>
              <div className="grid grid-cols-2 gap-1.5">
                {[
                  { id: 'consultative', label: 'Consultative' },
                  { id: 'professional', label: 'Professional' },
                  { id: 'bold_creator', label: 'Bold & Direct' },
                  { id: 'concise', label: 'Quick / Concise' },
                ].map((item) => (
                  <button
                    key={item.id}
                    disabled={!hasProfileData}
                    onClick={() => {
                      const nextTone = item.id as typeof tone;
                      setTone(nextTone);
                      setPitchText(generateProposal(nextTone));
                    }}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-mono font-medium transition-all cursor-pointer ${
                      tone === item.id
                        ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 shadow-sm font-bold'
                        : 'bg-slate-800/60 text-slate-400 hover:text-slate-200 border border-slate-800'
                    } ${!hasProfileData ? 'opacity-40 cursor-not-allowed' : ''}`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Grounded Evidence Citation Pill */}
            <div className="p-3.5 rounded-xl bg-[#070d1c] border border-slate-800 flex flex-col justify-between">
              <div>
                <label className="text-xs font-mono text-slate-400 uppercase tracking-wider block mb-1 font-bold">
                  Verified Evidence
                </label>
                <div className="flex items-center gap-2 text-xs text-cyan-300 bg-cyan-950/40 px-2.5 py-1.5 rounded-lg border border-cyan-900/50 font-mono truncate">
                  <FileText className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                  <span className="truncate">
                    {candidateSkills.length > 0 ? candidateSkills.slice(0, 3).join(', ') : `${candidateRole} Credentials`}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 pt-2 border-t border-slate-800/80 mt-2">
                <span>Profile: <strong className="text-slate-200">{candidateName || 'Not Set'}</strong></span>
                <span className="text-emerald-400 font-bold">{rateText || `${candidateRole}`}</span>
              </div>
            </div>

          </div>

          {/* Generated Pitch Text Box */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono text-slate-400 uppercase tracking-wider flex items-center gap-1.5 font-bold">
                <Bot className="w-3.5 h-3.5 text-cyan-400" />
                Personalized Proposal (Ready to Paste)
              </span>
              <button
                disabled={!hasProfileData}
                onClick={handleRegenerate}
                className="text-xs font-mono text-cyan-400 hover:text-cyan-300 flex items-center gap-1 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <RefreshCw className={`w-3 h-3 ${isGenerating ? 'animate-spin' : ''}`} />
                <span>Regenerate Proposal</span>
              </button>
            </div>

            <div className="relative">
              <textarea
                value={pitchText}
                onChange={(e) => setPitchText(e.target.value)}
                rows={13}
                disabled={!hasProfileData}
                className="w-full p-4 rounded-xl bg-[#060b18] border border-cyan-900/50 text-slate-200 font-mono text-xs leading-relaxed focus:outline-none focus:border-cyan-400 shadow-inner resize-y disabled:opacity-60"
              />
            </div>
          </div>

          {/* Key Terms Banner */}
          <div className="p-3.5 rounded-xl bg-gradient-to-r from-cyan-950/30 via-slate-900/50 to-violet-950/30 border border-cyan-800/40 flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
            <div className="flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-emerald-400" />
              <span className="text-slate-300">
                Rate: <strong className="text-emerald-400">{rateText || 'Project Based'}</strong>
              </span>
            </div>
            <div className="flex items-center gap-2 text-slate-400">
              <Clock className="w-3.5 h-3.5 text-cyan-400" />
              <span>
                {hoursPerWeek > 0 ? `${hoursPerWeek} hrs/week • ` : ''}
                {locationPref}
                {hasTimeline ? ` • ${timelineText}` : ''}
              </span>
            </div>
          </div>

        </div>

        {/* Modal Footer with Copy and Action */}
        <div className="p-4 border-t border-slate-800 bg-[#080d1a] flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              disabled={!hasProfileData}
              onClick={handleRegenerate}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-mono text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700 border border-slate-700 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isGenerating ? 'animate-spin' : ''}`} />
              <span>Regenerate</span>
            </button>

            <button
              onClick={onClose}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-800/60 hover:bg-slate-700 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
            >
              Cancel
            </button>
          </div>

          <button
            disabled={!hasProfileData}
            onClick={handleCopy}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold font-mono text-slate-950 bg-gradient-to-r from-cyan-400 via-sky-400 to-cyan-300 hover:from-cyan-300 hover:to-cyan-200 transition-all shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-slate-950 stroke-[3]" />
                <span>Copied to Clipboard!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 text-slate-950" />
                <span>Copy Proposal</span>
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
}
