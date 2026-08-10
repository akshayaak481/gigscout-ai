'use client';

import React from 'react';
import { ShieldCheck, ShieldAlert, AlertTriangle, Skull } from 'lucide-react';
import { RiskAssessment } from '@/types/opportunity';
import { getRiskLevelConfig } from '@/lib/utils';

interface RiskBadgeProps {
  assessment: RiskAssessment;
  showScore?: boolean;
  size?: 'sm' | 'md' | 'lg';
  onClick?: () => void;
}

export function RiskBadge({
  assessment,
  showScore = true,
  size = 'md',
  onClick,
}: RiskBadgeProps) {
  const config = getRiskLevelConfig(assessment.level);

  const getIcon = () => {
    switch (assessment.level) {
      case 'VERIFIED_SAFE':
        return <ShieldCheck className={size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5'} />;
      case 'LOW_RISK':
        return <ShieldCheck className={size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5'} />;
      case 'MODERATE_RISK':
        return <AlertTriangle className={size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5'} />;
      case 'CRITICAL_SCAM':
        return <Skull className={size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5'} />;
    }
  };

  const sizeClasses = {
    sm: 'text-[10px] px-2 py-0.5 gap-1',
    md: 'text-xs px-2.5 py-1 gap-1.5',
    lg: 'text-sm px-3 py-1.5 gap-2',
  }[size];

  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center rounded-full font-mono font-medium border transition-all duration-150 ${config.badgeBg} ${config.glow} ${sizeClasses} ${
        onClick ? 'hover:scale-105 cursor-pointer' : 'cursor-default'
      }`}
      title={`Risk Sentinel Score: ${assessment.score}/100 - ${assessment.summary}`}
    >
      {getIcon()}
      <span>{config.label}</span>
      {showScore && (
        <span className="opacity-75 font-mono text-[10px]">
          ({assessment.score}/100)
        </span>
      )}
    </button>
  );
}
