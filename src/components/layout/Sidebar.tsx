'use client';

import React from 'react';
import { 
  Search, 
  Briefcase, 
  Bookmark, 
  Bot, 
  Database, 
  User, 
  Settings,
  Sparkles,
  Zap
} from 'lucide-react';
import { DashboardTab } from '@/types/dashboard';
import { FreelancerProfile } from '@/types/profile';

interface SidebarProps {
  currentTab: DashboardTab;
  onSelectTab: (tab: DashboardTab) => void;
  activeProfile: FreelancerProfile;
  onEditProfile: () => void;
}

export function Sidebar({
  currentTab,
  onSelectTab,
  activeProfile,
  onEditProfile,
}: SidebarProps) {
  
  const navItems: { id: DashboardTab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'scout', label: 'Scout', icon: Search },
    { id: 'opportunities', label: 'Opportunities', icon: Briefcase },
    { id: 'saved', label: 'Saved', icon: Bookmark },
    { id: 'mission_control', label: 'AI Mission Control', icon: Bot },
    { id: 'knowledge_base', label: 'Knowledge Base', icon: Database },
    { id: 'profile', label: 'My Profile', icon: User },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <aside className="w-64 shrink-0 bg-[#070b18] border-r border-slate-800/80 flex flex-col justify-between h-screen sticky top-0 select-none">
      
      {/* Top Brand Section & Menu */}
      <div className="p-4 space-y-6">
        
        {/* Brand Header */}
        <div className="flex items-center gap-3 px-2 py-1">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 via-purple-600 to-pink-500 p-[1px] flex items-center justify-center shadow-lg shadow-purple-600/30">
            <div className="w-full h-full bg-[#0b0f24] rounded-[11px] flex items-center justify-center">
              <Zap className="w-4 h-4 text-purple-400 fill-purple-400/30" />
            </div>
          </div>
          <div>
            <h1 className="font-extrabold text-base text-white tracking-tight flex items-center gap-1">
              GigScout AI
            </h1>
            <p className="text-[11px] text-slate-400 font-medium">
              Find. Match. Win.
            </p>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-150 text-left ${
                  isActive
                    ? 'bg-[#312563] text-purple-200 border border-purple-500/40 shadow-lg shadow-purple-900/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-purple-300' : 'text-slate-400'}`} />
                <span>{item.label}</span>
                {item.id === 'mission_control' && (
                  <span className="ml-auto w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                )}
              </button>
            );
          })}
        </nav>

      </div>

      {/* Bottom SCOUT PROFILE Card */}
      <div className="p-4 border-t border-slate-800/80 bg-[#090e21]/70">
        <div className="flex items-center justify-between mb-3">
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-purple-400">
            SCOUT PROFILE
          </span>
          <button
            onClick={onEditProfile}
            className="px-2.5 py-0.5 rounded-md text-[10px] font-mono font-bold bg-[#312563] text-purple-200 hover:bg-purple-800/80 transition-colors border border-purple-500/40 cursor-pointer"
          >
            Edit
          </button>
        </div>

        <div className="space-y-2.5 text-xs">
          <div>
            <span className="text-[10px] text-slate-500 block font-mono">Role</span>
            <span className="font-semibold text-slate-200 text-xs truncate block">
              {activeProfile.targetRole}
            </span>
          </div>

          <div>
            <span className="text-[10px] text-slate-500 block font-mono">Skills</span>
            <p className="text-[11px] text-slate-300 line-clamp-2 leading-tight">
              {activeProfile.skills.map(s => s.name).slice(0, 4).join(', ')}
            </p>
          </div>

          <div>
            <span className="text-[10px] text-slate-500 block font-mono">Budget</span>
            <span className="font-mono font-bold text-slate-200 text-xs">
              {activeProfile.currency === 'INR' 
                ? `₹${activeProfile.hourlyRateMin.toLocaleString()}+ per project` 
                : `$${activeProfile.hourlyRateMin}+ / hr`}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <span className="text-[10px] text-slate-500 block font-mono">Location</span>
              <span className="text-slate-300 font-mono text-[11px] truncate block">
                {activeProfile.locationPreference || 'Remote'}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 block font-mono">Availability</span>
              <span className="text-slate-300 font-mono text-[11px]">
                {activeProfile.availabilityHoursPerWeek} hrs / week
              </span>
            </div>
          </div>

          <div>
            <span className="text-[10px] text-slate-500 block font-mono">Project Duration</span>
            <span className="text-slate-300 font-mono text-[11px] truncate block">
              {activeProfile.projectDuration || '1 - 2 weeks'}
            </span>
          </div>
        </div>
      </div>

    </aside>
  );
}
