import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { RiskLevel } from '@/types/opportunity';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number, currency: string = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatTimeAgo(isoString: string): string {
  try {
    const date = new Date(isoString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (seconds < 60) return 'Just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 30) return `${days}d ago`;
    return date.toLocaleDateString();
  } catch {
    return 'Recently';
  }
}

export function getRiskLevelConfig(level: RiskLevel) {
  switch (level) {
    case 'VERIFIED_SAFE':
      return {
        label: 'Verified Safe',
        color: 'text-emerald-400',
        bgColor: 'bg-emerald-500/10 border-emerald-500/30',
        badgeBg: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
        glow: 'shadow-[0_0_15px_rgba(16,185,129,0.2)]',
        indicator: 'bg-emerald-400',
      };
    case 'LOW_RISK':
      return {
        label: 'Low Risk',
        color: 'text-cyan-400',
        bgColor: 'bg-cyan-500/10 border-cyan-500/30',
        badgeBg: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40',
        glow: 'shadow-[0_0_15px_rgba(6,182,212,0.2)]',
        indicator: 'bg-cyan-400',
      };
    case 'MODERATE_RISK':
      return {
        label: 'Caution / Moderate Risk',
        color: 'text-amber-400',
        bgColor: 'bg-amber-500/10 border-amber-500/30',
        badgeBg: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
        glow: 'shadow-[0_0_15px_rgba(245,158,11,0.2)]',
        indicator: 'bg-amber-400',
      };
    case 'CRITICAL_SCAM':
      return {
        label: 'Scam Alert / Critical Risk',
        color: 'text-rose-400',
        bgColor: 'bg-rose-500/10 border-rose-500/30',
        badgeBg: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
        glow: 'shadow-[0_0_15px_rgba(244,63,94,0.3)]',
        indicator: 'bg-rose-400',
      };
  }
}

export function getMatchScoreColor(score: number): {
  text: string;
  badge: string;
  ring: string;
} {
  if (score >= 88) {
    return {
      text: 'text-emerald-400',
      badge: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
      ring: '#10b981',
    };
  }
  if (score >= 75) {
    return {
      text: 'text-cyan-400',
      badge: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30',
      ring: '#06b6d4',
    };
  }
  if (score >= 60) {
    return {
      text: 'text-violet-400',
      badge: 'bg-violet-500/15 text-violet-300 border-violet-500/30',
      ring: '#8b5cf6',
    };
  }
  return {
    text: 'text-slate-400',
    badge: 'bg-slate-500/15 text-slate-300 border-slate-500/30',
    ring: '#64748b',
  };
}
