'use client';

import React, { useState, useEffect } from 'react';
import { 
  User, 
  Briefcase, 
  DollarSign, 
  Clock, 
  MapPin, 
  Sparkles, 
  Save, 
  Check, 
  Plus, 
  Trash2, 
  AlertCircle, 
  Database, 
  RefreshCw, 
  Calendar,
  Users
} from 'lucide-react';
import { FreelancerProfile, SkillProficiency } from '@/types/profile';
import confetti from 'canvas-confetti';

interface ProfileViewProps {
  activeProfile: FreelancerProfile;
  allProfiles?: FreelancerProfile[];
  onSelectProfile?: (profile: FreelancerProfile) => void;
  onCreateNewProfile?: () => void;
  onSaveProfile: (updated: FreelancerProfile) => Promise<{ success: boolean; data: FreelancerProfile; error?: string | null; source: 'supabase' | 'local' }>;
  onDeleteProfile?: (profileId: string) => Promise<{ success: boolean; message?: string; error?: string | null }>;
  isLoading?: boolean;
}

export function ProfileView({
  activeProfile,
  allProfiles = [],
  onSelectProfile,
  onCreateNewProfile,
  onSaveProfile,
  onDeleteProfile,
  isLoading = false,
}: ProfileViewProps) {
  const [profile, setProfile] = useState<FreelancerProfile>(activeProfile);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const [newSkill, setNewSkill] = useState<string>('');

  useEffect(() => {
    setProfile(activeProfile);
  }, [activeProfile]);

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsSaving(true);
    setStatusMessage(null);

    try {
      const result = await onSaveProfile(profile);
      setIsSaving(false);

      if (result.success) {
        setStatusMessage({
          type: 'success',
          text: result.source === 'supabase'
            ? `Profile "${result.data.name}" successfully saved and synced to Supabase database!`
            : `Profile "${result.data.name}" saved locally! (Supabase credentials not configured in .env)`,
        });

        confetti({
          particleCount: 40,
          spread: 60,
          origin: { y: 0.6 },
          colors: ['#8b5cf6', '#06b6d4', '#10b981'],
        });

        setTimeout(() => {
          setStatusMessage(null);
        }, 5000);
      } else {
        setStatusMessage({
          type: 'error',
          text: result.error || 'Failed to persist profile changes.',
        });
      }
    } catch (err: any) {
      setIsSaving(false);
      setStatusMessage({
        type: 'error',
        text: err.message || 'An unexpected error occurred while saving.',
      });
    }
  };

  const handleConfirmDelete = async () => {
    if (!onDeleteProfile) return;
    setIsDeleting(true);
    setStatusMessage(null);

    try {
      const result = await onDeleteProfile(activeProfile.id);
      setIsDeleting(false);
      setIsDeleteModalOpen(false);

      if (result.success) {
        setStatusMessage({
          type: 'success',
          text: result.message || `Profile "${activeProfile.name}" was successfully deleted.`,
        });

        setTimeout(() => {
          setStatusMessage(null);
        }, 5000);
      } else {
        setStatusMessage({
          type: 'error',
          text: result.error || 'Failed to delete profile.',
        });
      }
    } catch (err: any) {
      setIsDeleting(false);
      setIsDeleteModalOpen(false);
      setStatusMessage({
        type: 'error',
        text: err.message || 'An error occurred during deletion.',
      });
    }
  };

  const handleAddSkill = () => {
    if (!newSkill.trim()) return;
    const added: SkillProficiency = {
      name: newSkill.trim(),
      category: 'backend',
      yearsExperience: 2,
      level: 'advanced',
    };
    setProfile(prev => ({
      ...prev,
      skills: [...prev.skills, added],
    }));
    setNewSkill('');
  };

  const handleRemoveSkill = (name: string) => {
    setProfile(prev => ({
      ...prev,
      skills: prev.skills.filter(s => s.name !== name),
    }));
  };

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-4xl mx-auto py-8">
        <div className="flex items-center justify-between">
          <div className="h-8 w-64 bg-slate-800 animate-pulse rounded-lg" />
          <div className="h-10 w-32 bg-slate-800 animate-pulse rounded-xl" />
        </div>
        <div className="p-8 rounded-2xl bg-[#0a0e1f] border border-slate-800 space-y-4">
          <div className="h-6 w-48 bg-slate-800 animate-pulse rounded" />
          <div className="grid grid-cols-2 gap-4">
            <div className="h-10 bg-slate-900 animate-pulse rounded-xl" />
            <div className="h-10 bg-slate-900 animate-pulse rounded-xl" />
          </div>
          <div className="h-24 bg-slate-900 animate-pulse rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <>
      <form onSubmit={handleSave} className="space-y-6 max-w-4xl mx-auto py-4">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-extrabold text-white tracking-tight">
                Freelancer Profile &amp; Preferences
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-purple-500/10 text-purple-300 border border-purple-500/30">
                Supabase Connected
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Manage your persistent freelance profile. These parameters guide the autonomous agent scout, RAG vector matching, and pitch generation.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {onDeleteProfile && (
              <button
                type="button"
                disabled={isSaving || isDeleting}
                onClick={() => setIsDeleteModalOpen(true)}
                className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-rose-400 hover:text-rose-200 bg-rose-950/40 hover:bg-rose-900/60 border border-rose-800/50 shadow-md shadow-rose-950/30 transition-all cursor-pointer disabled:opacity-50"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Profile</span>
              </button>
            )}

            <button
              type="submit"
              disabled={isSaving || isDeleting}
              className="flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-500 hover:from-purple-500 hover:to-indigo-500 shadow-md shadow-purple-600/30 transition-all shrink-0 cursor-pointer disabled:opacity-50"
            >
              {isSaving ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-white" />
                  <span>Saving to Supabase...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 text-white" />
                  <span>Save Profile</span>
                </>
              )}
            </button>
          </div>
        </div>

      {/* Active Identity Switcher Bar */}
      {allProfiles && allProfiles.length > 0 && (
        <div className="p-4 rounded-2xl bg-[#090e21] border border-purple-900/40 flex flex-wrap items-center justify-between gap-3 shadow-lg">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-mono text-purple-300 font-bold uppercase tracking-wider flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-purple-400" />
              Switch Profile:
            </span>
            {allProfiles.map((p) => {
              const isCurrent = p.id === activeProfile.id || p.name === activeProfile.name;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => onSelectProfile && onSelectProfile(p)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    isCurrent
                      ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30 ring-1 ring-purple-400'
                      : 'bg-slate-900/80 text-slate-300 hover:text-white hover:bg-slate-800 border border-slate-800'
                  }`}
                >
                  <User className="w-3.5 h-3.5" />
                  <span>{p.name}</span>
                  <span className="text-[10px] opacity-75 font-normal">({p.targetRole.split('/')[0].trim()})</span>
                </button>
              );
            })}
          </div>

          {onCreateNewProfile && (
            <button
              type="button"
              onClick={onCreateNewProfile}
              className="px-3 py-1.5 rounded-xl text-xs font-mono font-bold text-cyan-300 bg-cyan-950/60 hover:bg-cyan-900/60 border border-cyan-700/50 transition-all cursor-pointer flex items-center gap-1 shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ New Freelancer Profile</span>
            </button>
          )}
        </div>
      )}

      {/* Notification / Status Banner */}
      {statusMessage && (
        <div
          className={`p-4 rounded-xl border flex items-center justify-between text-xs font-mono transition-all animate-in fade-in duration-200 ${
            statusMessage.type === 'success'
              ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
              : 'bg-rose-950/40 border-rose-500/40 text-rose-300'
          }`}
        >
          <div className="flex items-center gap-2">
            {statusMessage.type === 'success' ? (
              <Check className="w-4 h-4 text-emerald-400 shrink-0 stroke-[3]" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            )}
            <span>{statusMessage.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setStatusMessage(null)}
            className="text-slate-400 hover:text-white ml-2 text-sm cursor-pointer"
          >
            ×
          </button>
        </div>
      )}

      {/* Main Form Fields */}
      <div className="space-y-6">
        
        {/* 1. Core Identity & Role */}
        <div className="p-6 rounded-2xl bg-[#0a0e1f] border border-slate-800 space-y-4">
          <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-purple-400 flex items-center gap-2">
            <User className="w-4 h-4 text-purple-400" />
            1. Core Identity &amp; Title
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-slate-400 font-mono block mb-1">
                Full Name <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                required
                value={profile.name}
                onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                className="w-full p-2.5 rounded-xl bg-[#070b18] border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-purple-500/60 font-mono"
              />
            </div>

            <div>
              <label className="text-xs text-slate-400 font-mono block mb-1">
                Target Professional Role <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                required
                value={profile.targetRole}
                onChange={(e) => setProfile({ ...profile, targetRole: e.target.value })}
                className="w-full p-2.5 rounded-xl bg-[#070b18] border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-purple-500/60 font-mono"
              />
            </div>
          </div>

          <div>
            <label className="text-xs text-slate-400 font-mono block mb-1">
              Bio &amp; Professional Summary
            </label>
            <textarea
              rows={3}
              value={profile.bio}
              onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
              placeholder="Describe your background, specialization, and key differentiators..."
              className="w-full p-3 rounded-xl bg-[#070b18] border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-purple-500/60 font-mono resize-none leading-relaxed"
            />
          </div>
        </div>

        {/* 2. Budget, Rate, Location & Availability */}
        <div className="p-6 rounded-2xl bg-[#0a0e1f] border border-slate-800 space-y-4">
          <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-purple-400 flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-purple-400" />
            2. Commercial Budget &amp; Availability Preferences
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="text-xs text-slate-400 font-mono block mb-1">
                Min Hourly Rate ($ / ₹)
              </label>
              <input
                type="number"
                min="0"
                value={profile.hourlyRateMin}
                onChange={(e) => setProfile({ ...profile, hourlyRateMin: Number(e.target.value) })}
                className="w-full p-2.5 rounded-xl bg-[#070b18] border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-purple-500/60 font-mono"
              />
            </div>

            <div>
              <label className="text-xs text-slate-400 font-mono block mb-1">
                Max Hourly Rate ($ / ₹)
              </label>
              <input
                type="number"
                min="0"
                value={profile.hourlyRateMax}
                onChange={(e) => setProfile({ ...profile, hourlyRateMax: Number(e.target.value) })}
                className="w-full p-2.5 rounded-xl bg-[#070b18] border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-purple-500/60 font-mono"
              />
            </div>

            <div>
              <label className="text-xs text-slate-400 font-mono block mb-1">
                Currency
              </label>
              <select
                value={profile.currency}
                onChange={(e) => setProfile({ ...profile, currency: e.target.value })}
                className="w-full p-2.5 rounded-xl bg-[#070b18] border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-purple-500/60 font-mono"
              >
                <option value="USD">USD ($)</option>
                <option value="INR">INR (₹)</option>
                <option value="EUR">EUR (€)</option>
                <option value="GBP">GBP (£)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            <div>
              <label className="text-xs text-slate-400 font-mono block mb-1">
                Availability (Hours / Week)
              </label>
              <input
                type="number"
                min="1"
                max="80"
                value={profile.availabilityHoursPerWeek}
                onChange={(e) => setProfile({ ...profile, availabilityHoursPerWeek: Number(e.target.value) })}
                className="w-full p-2.5 rounded-xl bg-[#070b18] border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-purple-500/60 font-mono"
              />
            </div>

            <div>
              <label className="text-xs text-slate-400 font-mono block mb-1">
                Location Preference
              </label>
              <select
                value={profile.locationPreference}
                onChange={(e) => setProfile({ ...profile, locationPreference: e.target.value })}
                className="w-full p-2.5 rounded-xl bg-[#070b18] border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-purple-500/60 font-mono"
              >
                <option value="Remote">Remote Only</option>
                <option value="Hybrid">Hybrid</option>
                <option value="Onsite">Onsite</option>
              </select>
            </div>

            <div>
              <label className="text-xs text-slate-400 font-mono block mb-1">
                Project Duration
              </label>
              <select
                value={profile.projectDuration}
                onChange={(e) => setProfile({ ...profile, projectDuration: e.target.value })}
                className="w-full p-2.5 rounded-xl bg-[#070b18] border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-purple-500/60 font-mono"
              >
                <option value="1 - 2 weeks">1 - 2 weeks</option>
                <option value="1 - 3 months">1 - 3 months</option>
                <option value="3 - 6 months">3 - 6 months</option>
                <option value="Long Term">Long Term</option>
              </select>
            </div>
          </div>
        </div>

        {/* 3. Technical Skills & Core Competencies */}
        <div className="p-6 rounded-2xl bg-[#0a0e1f] border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-purple-400 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-400" />
              3. Verified Technical Skills ({profile.skills.length})
            </h3>
          </div>

          {/* Add Skill Input */}
          <div className="flex gap-2">
            <input
              type="text"
              value={newSkill}
              onChange={(e) => setNewSkill(e.target.value)}
              placeholder="Add skill (e.g. Generative AI, RAG, Power BI, Python, Azure, Databricks)..."
              className="flex-1 p-2.5 rounded-xl bg-[#070b18] border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-purple-500/60 font-mono"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddSkill();
                }
              }}
            />
            <button
              type="button"
              onClick={handleAddSkill}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-[#312563] text-purple-200 hover:bg-purple-800/80 border border-purple-500/40 transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add</span>
            </button>
          </div>

          {/* Skill Tag Pills */}
          <div className="flex flex-wrap gap-2 pt-1">
            {profile.skills.map((skill, idx) => {
              const skillName = typeof skill === 'string' ? skill : skill.name;
              return (
                <span
                  key={idx}
                  className="px-3 py-1.5 rounded-xl text-xs font-mono bg-purple-500/10 text-purple-200 border border-purple-500/30 flex items-center gap-2 group hover:border-purple-500/60 transition-colors"
                >
                  <span>{skillName}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveSkill(skillName)}
                    className="text-slate-400 hover:text-rose-400 transition-colors"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </span>
              );
            })}
          </div>
        </div>

      </div>

    </form>

    {/* Delete Profile Confirmation Modal */}
    {isDeleteModalOpen && (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
        <div className="bg-[#0b0f24] border border-rose-900/60 rounded-2xl max-w-md w-full p-6 space-y-5 shadow-2xl shadow-rose-950/40">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center shrink-0">
              <Trash2 className="w-5 h-5 text-rose-400" />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-white tracking-tight">
                Delete Profile: {activeProfile.name || 'Freelancer'}
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Are you sure you want to delete <strong className="text-rose-300 font-semibold">{activeProfile.name}</strong>? This will remove the profile and its associated saved opportunities and knowledge-base data. This action cannot be undone.
              </p>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-rose-950/30 border border-rose-900/40 text-[11px] font-mono text-rose-300">
            ⚠️ Data to be permanently deleted:
            <ul className="list-disc list-inside mt-1 space-y-0.5 text-rose-400/90 text-[10.5px]">
              <li>Profile metadata &amp; preferences ({activeProfile.targetRole})</li>
              <li>Saved opportunities associated with this profile</li>
              <li>Resume &amp; portfolio knowledge-base vector chunks</li>
            </ul>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              disabled={isDeleting}
              onClick={() => setIsDeleteModalOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-800 transition-colors cursor-pointer disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={isDeleting}
              onClick={handleConfirmDelete}
              className="flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 shadow-lg shadow-rose-600/30 transition-all cursor-pointer disabled:opacity-50"
            >
              {isDeleting ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Deleting Profile...</span>
                </>
              ) : (
                <>
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Yes, Delete Profile</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    )}
  </>
  );
}
