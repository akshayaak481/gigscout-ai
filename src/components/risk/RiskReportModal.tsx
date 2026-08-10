'use client';

import React from 'react';
import { 
  X, 
  ShieldAlert, 
  ShieldCheck, 
  AlertTriangle, 
  Skull, 
  CheckCircle2, 
  AlertOctagon, 
  Info,
  ExternalLink
} from 'lucide-react';
import { Opportunity } from '@/types/opportunity';
import { getRiskLevelConfig } from '@/lib/utils';

interface RiskReportModalProps {
  opportunity: Opportunity | null;
  isOpen: boolean;
  onClose: () => void;
}

export function RiskReportModal({ opportunity, isOpen, onClose }: RiskReportModalProps) {
  if (!isOpen || !opportunity) return null;

  const assessment = opportunity.riskAssessment;
  const config = getRiskLevelConfig(assessment.level);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-2xl bg-[#0d1326] border border-cyan-800/50 rounded-2xl shadow-2xl overflow-hidden text-slate-200 flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with Risk Level Glow */}
        <div className={`p-6 border-b border-slate-800/80 ${config.bgColor} flex items-start justify-between`}>
          <div className="flex items-center gap-3">
            <div className={`p-3 rounded-xl border ${config.badgeBg} ${config.glow}`}>
              {assessment.level === 'CRITICAL_SCAM' ? (
                <Skull className="w-6 h-6 text-rose-400" />
              ) : assessment.level === 'MODERATE_RISK' ? (
                <AlertTriangle className="w-6 h-6 text-amber-400" />
              ) : (
                <ShieldCheck className="w-6 h-6 text-emerald-400" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono uppercase tracking-widest text-slate-400">
                  Risk Intelligence Audit
                </span>
                <span className={`text-xs px-2 py-0.5 rounded-full font-mono font-bold ${config.badgeBg}`}>
                  Score: {assessment.score}/100
                </span>
              </div>
              <h2 className="text-lg font-bold text-white mt-0.5">
                {config.label}
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-lg bg-slate-800/50 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-sm">
          
          {/* Opportunity Quick Info */}
          <div className="p-3.5 rounded-xl bg-slate-900/70 border border-slate-800">
            <p className="text-xs font-mono text-cyan-400 uppercase tracking-wider mb-1">
              Target Listing
            </p>
            <h3 className="font-semibold text-white">{opportunity.title}</h3>
            <p className="text-xs text-slate-400 mt-1">
              Platform: <span className="text-slate-200 capitalize">{opportunity.platform}</span> • Client: <span className="text-slate-200">{opportunity.clientName}</span>
            </p>
          </div>

          {/* AI Risk Summary */}
          <div>
            <h4 className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Info className="w-4 h-4 text-cyan-400" />
              Risk Sentinel Analysis Summary
            </h4>
            <p className="text-slate-300 leading-relaxed bg-[#080d1a] p-4 rounded-xl border border-slate-800/80">
              {assessment.summary}
            </p>
          </div>

          {/* Red Flags Breakdown (if any) */}
          {assessment.redFlags.length > 0 && (
            <div>
              <h4 className="text-xs font-mono font-bold text-rose-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <AlertOctagon className="w-4 h-4 text-rose-400" />
                Detected Red Flags ({assessment.redFlags.length})
              </h4>
              <div className="space-y-3">
                {assessment.redFlags.map((flag) => (
                  <div 
                    key={flag.id}
                    className="p-3.5 rounded-xl bg-rose-950/20 border border-rose-800/40 space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-rose-200 text-xs">
                        {flag.title}
                      </span>
                      <span className="px-2 py-0.5 rounded text-[10px] uppercase font-mono font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                        {flag.severity} severity
                      </span>
                    </div>
                    <p className="text-xs text-slate-300">
                      {flag.description}
                    </p>
                    {flag.evidence && (
                      <div className="text-[11px] font-mono text-rose-300/90 bg-black/40 p-2 rounded border border-rose-900/40">
                        <span className="text-slate-400">Signal: </span> &quot;{flag.evidence}&quot;
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Safety Signals (if any) */}
          {assessment.safetySignals.length > 0 && (
            <div>
              <h4 className="text-xs font-mono font-bold text-emerald-400 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                Verified Safety Signals ({assessment.safetySignals.length})
              </h4>
              <ul className="space-y-2">
                {assessment.safetySignals.map((signal, idx) => (
                  <li 
                    key={idx} 
                    className="flex items-start gap-2 text-xs text-slate-300 bg-emerald-950/20 border border-emerald-800/30 p-2.5 rounded-lg"
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>{signal}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Safety Recommendation Banner */}
          <div className={`p-4 rounded-xl border flex items-center justify-between ${
            assessment.safeToApply 
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
              : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
          }`}>
            <div>
              <p className="font-bold text-xs">
                {assessment.safeToApply ? 'Recommendation: Safe to Proceed' : 'Recommendation: High Risk / Do Not Apply'}
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                {assessment.safeToApply 
                  ? 'Always maintain contract and communication on verified platform escrow.'
                  : 'Report this opportunity immediately to protect fellow freelancers.'}
              </p>
            </div>
            <a
              href={opportunity.platformUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 shrink-0 ml-4"
            >
              <span>View Original</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-800 bg-[#0a0f20] flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-white transition-colors"
          >
            Close Report
          </button>
        </div>

      </div>
    </div>
  );
}
