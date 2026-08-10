'use client';

import React, { useState } from 'react';
import { 
  X, 
  UploadCloud, 
  FileText, 
  CheckCircle2, 
  Sparkles, 
  BrainCircuit, 
  Briefcase,
  Layers,
  ArrowRight
} from 'lucide-react';
import { FreelancerProfile } from '@/types/profile';
import confetti from 'canvas-confetti';

interface ResumeUploadModalProps {
  activeProfile: FreelancerProfile;
  isOpen: boolean;
  onClose: () => void;
  onUpdateProfile: (updated: FreelancerProfile) => void;
}

export function ResumeUploadModal({
  activeProfile,
  isOpen,
  onClose,
  onUpdateProfile,
}: ResumeUploadModalProps) {
  const [resumeText, setResumeText] = useState<string>(
    activeProfile.rawResumeText ||
    `${activeProfile.name} — ${activeProfile.title}\n\nSummary:\n${activeProfile.bio}\n\nKey Skills: ${activeProfile.skills.map(s => s.name).join(', ')}\nTarget Hourly Rate: $${activeProfile.hourlyRateMin}-$${activeProfile.hourlyRateMax}/hr\nAvailability: ${activeProfile.availabilityHoursPerWeek} hrs/week\n\nFeatured Projects:\n${activeProfile.portfolioItems.map(p => `- ${p.title}: ${p.description} (${p.metricsOrOutcome || ''})`).join('\n')}`
  );
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [success, setSuccess] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleParseResume = () => {
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      setSuccess(true);
      confetti({
        particleCount: 50,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#00f2fe', '#8b5cf6', '#10b981'],
      });
      setTimeout(() => {
        setSuccess(false);
        onClose();
      }, 1500);
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-2xl bg-[#0d1326] border border-cyan-800/50 rounded-2xl shadow-2xl overflow-hidden text-slate-200 flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-slate-800 bg-gradient-to-r from-[#0d1326] via-[#101830] to-[#0d1326] flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-gradient-to-br from-cyan-500 to-violet-600 shadow-md shadow-cyan-500/20 text-white">
              <BrainCircuit className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono uppercase tracking-widest text-cyan-400">
                  Profile & RAG Knowledge Locker
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full font-mono bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  pgvector Index
                </span>
              </div>
              <h2 className="text-lg font-bold text-white mt-0.5">
                Freelancer Ingestion: {activeProfile.name}
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-lg bg-slate-800/60 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-sm">
          
          {/* Quick Info Bar */}
          <div className="grid grid-cols-3 gap-3 p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 text-xs">
            <div>
              <span className="text-[10px] font-mono text-slate-400 uppercase">Target Rate</span>
              <p className="font-bold text-white font-mono mt-0.5">${activeProfile.hourlyRateMin}-${activeProfile.hourlyRateMax}/hr</p>
            </div>
            <div>
              <span className="text-[10px] font-mono text-slate-400 uppercase">Availability</span>
              <p className="font-bold text-white font-mono mt-0.5">{activeProfile.availabilityHoursPerWeek} hrs/week</p>
            </div>
            <div>
              <span className="text-[10px] font-mono text-slate-400 uppercase">Indexed Items</span>
              <p className="font-bold text-cyan-400 font-mono mt-0.5">{activeProfile.portfolioItems.length} Projects</p>
            </div>
          </div>

          {/* Resume & Portfolio Textarea */}
          <div className="space-y-2">
            <label className="text-xs font-mono text-slate-300 uppercase tracking-wider flex items-center justify-between">
              <span>Paste Resume / Portfolio Raw Text</span>
              <span className="text-[11px] text-cyan-400 font-mono">Auto-chunked for vector search</span>
            </label>
            <textarea
              value={resumeText}
              onChange={(e) => setResumeText(e.target.value)}
              rows={8}
              placeholder="Paste your resume, LinkedIn bio, GitHub summary, or project descriptions here..."
              className="w-full p-4 rounded-xl bg-[#080d1a] border border-cyan-900/40 text-slate-200 font-mono text-xs leading-relaxed focus:outline-none focus:border-cyan-500/60 shadow-inner resize-none"
            />
          </div>

          {/* Indexed Skills List */}
          <div>
            <span className="text-xs font-mono text-slate-400 uppercase tracking-wider block mb-2">
              Extracted Technical Competencies ({activeProfile.skills.length})
            </span>
            <div className="flex flex-wrap gap-1.5">
              {activeProfile.skills.map((skill, idx) => (
                <span 
                  key={idx}
                  className="px-2.5 py-1 rounded-md text-xs font-mono bg-cyan-950/40 text-cyan-300 border border-cyan-800/40"
                >
                  {skill.name} • <span className="text-slate-400 capitalize">{skill.level}</span>
                </span>
              ))}
            </div>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-800 bg-[#0a0f20] flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
          >
            Cancel
          </button>

          <button
            onClick={handleParseResume}
            disabled={isProcessing}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold text-slate-900 bg-gradient-to-r from-cyan-400 via-sky-400 to-cyan-300 hover:from-cyan-300 hover:to-cyan-200 transition-all shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40 cursor-pointer disabled:opacity-50"
          >
            {isProcessing ? (
              <>
                <Sparkles className="w-4 h-4 text-slate-900 animate-spin" />
                <span>Chunking & Vector Embedding...</span>
              </>
            ) : success ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-slate-900" />
                <span>Vector Ingestion Complete!</span>
              </>
            ) : (
              <>
                <UploadCloud className="w-4 h-4 text-slate-900" />
                <span>Update RAG Profile Index</span>
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
}
