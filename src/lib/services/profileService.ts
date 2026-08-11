import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { FreelancerProfile } from '@/types/profile';

const ACTIVE_PROFILE_ID_KEY = 'gigscout_active_profile_id';
const LOCAL_STORAGE_KEY_PREFIX = 'gigscout_profile_data_';

export interface ProfileServiceResponse {
  data: FreelancerProfile;
  source: 'supabase' | 'cache' | 'default';
  error?: string | null;
}

/**
 * Generate a deterministic or slug-based internal profile ID from a candidate name.
 */
export function generateProfileId(name: string): string {
  const clean = (name || '').trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  return clean ? `prof-${clean}` : `prof-${Date.now().toString(36)}`;
}

/**
 * Get active profile ID from client storage.
 */
export function getActiveProfileId(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return localStorage.getItem(ACTIVE_PROFILE_ID_KEY);
  } catch {
    return null;
  }
}

/**
 * Set active profile ID in client storage.
 */
export function setActiveProfileId(id: string): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(ACTIVE_PROFILE_ID_KEY, id);
  } catch {
    // Ignore storage quota errors
  }
}

// Map Database Row (snake_case) to FreelancerProfile (camelCase)
export function mapRowToProfile(row: any): FreelancerProfile {
  const name = row.name || 'Freelancer';
  const id = row.id || generateProfileId(name);
  const targetRole = row.target_role || row.title || 'AI & Data Engineering Freelancer';

  return {
    id,
    name,
    title: targetRole,
    avatarUrl: row.avatar_url || undefined,
    bio: row.bio || '',
    targetRole,
    skills: Array.isArray(row.skills) ? row.skills : [],
    hourlyRateMin: Number(row.hourly_rate_min) || 0,
    hourlyRateMax: Number(row.hourly_rate_max) || 0,
    currency: row.currency || 'USD',
    availabilityHoursPerWeek: Number(row.availability_hours_per_week) || 20,
    experienceYears: Number(row.experience_years) || 1,
    preferredPlatforms: Array.isArray(row.preferred_platforms) ? row.preferred_platforms : ['upwork', 'weworkremotely', 'reddit'],
    locationPreference: row.location_preference || 'Remote',
    projectDuration: row.project_duration || '1 - 2 weeks',
    portfolioItems: Array.isArray(row.portfolio_items) ? row.portfolio_items : [],
    rawResumeText: row.raw_resume_text || '',
    createdAt: row.created_at || new Date().toISOString(),
    updatedAt: row.updated_at || new Date().toISOString(),
  };
}

// Map FreelancerProfile (camelCase) to Database Row (snake_case)
export function mapProfileToRow(profile: FreelancerProfile) {
  return {
    id: profile.id,
    name: profile.name,
    title: profile.targetRole || profile.title,
    target_role: profile.targetRole || profile.title,
    bio: profile.bio || '',
    skills: profile.skills || [],
    hourly_rate_min: profile.hourlyRateMin || 0,
    hourly_rate_max: profile.hourlyRateMax || 0,
    currency: profile.currency || 'USD',
    availability_hours_per_week: profile.availabilityHoursPerWeek || 20,
    location_preference: profile.locationPreference || 'Remote',
    project_duration: profile.projectDuration || '1 - 2 weeks',
    portfolio_items: profile.portfolioItems || [],
    raw_resume_text: profile.rawResumeText || '',
    updated_at: new Date().toISOString(),
  };
}

/**
 * Fetch all available profiles from Supabase.
 */
export async function fetchAllProfiles(): Promise<FreelancerProfile[]> {
  if (!isSupabaseConfigured) {
    return [];
  }

  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('updated_at', { ascending: false });

    if (!error && data && data.length > 0) {
      return data.map(mapRowToProfile);
    }
  } catch (err: any) {
    console.warn('Supabase fetchAllProfiles notice:', err.message);
  }

  return [];
}

/**
 * Fetch a specific profile or the active freelancer profile from Supabase.
 */
export async function fetchActiveProfile(preferredProfileId?: string): Promise<ProfileServiceResponse> {
  const activeId = preferredProfileId || getActiveProfileId();

  // 1. Fetch live from Supabase
  if (isSupabaseConfigured) {
    try {
      let query = supabase.from('profiles').select('*');

      if (activeId) {
        // Try specific active profile
        const { data: specificData, error: specErr } = await query
          .eq('id', activeId)
          .limit(1);

        if (!specErr && specificData && specificData.length > 0) {
          const profile = mapRowToProfile(specificData[0]);
          setActiveProfileId(profile.id);
          return { data: profile, source: 'supabase', error: null };
        }
      }

      // If active ID not found or not specified, fetch most recently updated profile
      const { data: allData, error: allErr } = await supabase
        .from('profiles')
        .select('*')
        .order('updated_at', { ascending: false })
        .limit(1);

      if (!allErr && allData && allData.length > 0) {
        const profile = mapRowToProfile(allData[0]);
        setActiveProfileId(profile.id);
        return { data: profile, source: 'supabase', error: null };
      }
    } catch (err: any) {
      console.warn('Supabase profile fetch error:', err.message);
    }
  }

  // 2. Cache Fallback per profile ID
  if (typeof window !== 'undefined') {
    const cacheKey = activeId ? `${LOCAL_STORAGE_KEY_PREFIX}${activeId}` : `${LOCAL_STORAGE_KEY_PREFIX}default`;
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (parsed && parsed.name) {
          return { data: parsed, source: 'cache', error: null };
        }
      } catch {
        // invalid JSON
      }
    }
  }

  // 3. Default fallback
  const initial: FreelancerProfile = {
    id: activeId || 'prof-akshaya',
    name: 'Akshaya',
    title: 'AI & Data Engineering Freelancer',
    bio: 'AI & Data Engineering specialist building production RAG systems, Databricks pipelines, and LLM applications.',
    targetRole: 'AI & Data Engineering Freelancer',
    hourlyRateMin: 50,
    hourlyRateMax: 95,
    currency: 'USD',
    availabilityHoursPerWeek: 25,
    experienceYears: 3,
    preferredPlatforms: ['upwork', 'weworkremotely', 'reddit'],
    locationPreference: 'Remote',
    projectDuration: '1 - 2 weeks',
    skills: [
      { name: 'Generative AI', category: 'ai_ml', yearsExperience: 2, level: 'expert' },
      { name: 'RAG', category: 'ai_ml', yearsExperience: 2, level: 'expert' },
      { name: 'Databricks', category: 'backend', yearsExperience: 2, level: 'advanced' },
      { name: 'Python', category: 'backend', yearsExperience: 3, level: 'expert' },
      { name: 'SQL', category: 'backend', yearsExperience: 3, level: 'expert' },
      { name: 'Azure', category: 'devops', yearsExperience: 2, level: 'advanced' },
      { name: 'Snowflake', category: 'backend', yearsExperience: 2, level: 'advanced' },
    ],
    portfolioItems: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  return { data: initial, source: 'default', error: null };
}

/**
 * Persist the updated freelancer profile to Supabase.
 * Determines identity to prevent overwriting different people.
 */
export async function saveActiveProfile(profile: FreelancerProfile): Promise<{
  success: boolean;
  data: FreelancerProfile;
  source: 'supabase' | 'local';
  error?: string | null;
}> {
  // 1. Resolve proper profile ID based on candidate name & existing identities
  let targetId = profile.id;

  if (isSupabaseConfigured) {
    try {
      // Check if a profile with the same name already exists in Supabase
      const { data: existingByName } = await supabase
        .from('profiles')
        .select('id, name')
        .ilike('name', profile.name.trim())
        .limit(1);

      if (existingByName && existingByName.length > 0) {
        // Match existing profile for this person
        targetId = existingByName[0].id;
      } else {
        // New person name entered: generate distinct profile ID
        const generated = generateProfileId(profile.name);
        if (!targetId || targetId === 'prof-active-user' || targetId.includes('video-editor') || !targetId.includes(profile.name.trim().toLowerCase().slice(0, 4))) {
          targetId = generated;
        }
      }
    } catch (e) {
      console.warn('Profile identity resolution notice:', e);
    }
  }

  if (!targetId) {
    targetId = generateProfileId(profile.name);
  }

  const updatedProfile: FreelancerProfile = {
    ...profile,
    id: targetId,
    title: profile.targetRole || profile.title,
    updatedAt: new Date().toISOString(),
  };

  // Sync to active profile ID in localStorage
  setActiveProfileId(targetId);
  if (typeof window !== 'undefined') {
    localStorage.setItem(`${LOCAL_STORAGE_KEY_PREFIX}${targetId}`, JSON.stringify(updatedProfile));
  }

  // 2. Persist to Supabase
  if (isSupabaseConfigured) {
    try {
      const row = mapProfileToRow(updatedProfile);
      const { error } = await supabase.from('profiles').upsert(row, { onConflict: 'id' });

      if (error) {
        console.error('Failed to save profile to Supabase:', error.message);
        return {
          success: true,
          data: updatedProfile,
          source: 'local',
          error: `Saved locally. (Supabase notice: ${error.message})`,
        };
      }

      return {
        success: true,
        data: updatedProfile,
        source: 'supabase',
        error: null,
      };
    } catch (err: any) {
      return {
        success: true,
        data: updatedProfile,
        source: 'local',
        error: `Saved locally. (Network issue: ${err.message})`,
      };
    }
  }

  return {
    success: true,
    data: updatedProfile,
    source: 'local',
    error: null,
  };
}

/**
 * Delete a freelancer profile and all its associated data (saved opportunities, embeddings, storage cache).
 */
export async function deleteProfile(profileId: string): Promise<{
  success: boolean;
  message?: string;
  error?: string | null;
}> {
  if (!profileId || !profileId.trim()) {
    return { success: false, error: 'profileId is required for deletion.' };
  }

  const targetId = profileId.trim();

  // 1. Clean localStorage caches
  if (typeof window !== 'undefined') {
    try {
      localStorage.removeItem(`${LOCAL_STORAGE_KEY_PREFIX}${targetId}`);
      localStorage.removeItem(`gigscout_saved_opportunities_${targetId}`);
      if (getActiveProfileId() === targetId) {
        localStorage.removeItem(ACTIVE_PROFILE_ID_KEY);
      }
    } catch (e) {
      console.warn('LocalStorage cleanup notice:', e);
    }
  }

  // 2. Call server API
  try {
    const res = await fetch(`/api/profile?profileId=${encodeURIComponent(targetId)}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
    });

    const json = await res.json().catch(() => ({}));

    if (res.ok && json.success) {
      return {
        success: true,
        message: json.message || `Profile "${targetId}" deleted successfully.`,
      };
    }

    if (json.error) {
      return { success: false, error: json.error };
    }
  } catch (apiErr: any) {
    console.warn('API deleteProfile notice:', apiErr.message);
  }

  // 3. Direct client fallback if API failed or offline
  if (isSupabaseConfigured) {
    try {
      await supabase.from('saved_opportunities').delete().eq('profile_id', targetId);
      await supabase.from('portfolio_embeddings').delete().eq('profile_id', targetId);
      const { error } = await supabase.from('profiles').delete().eq('id', targetId);

      if (error) {
        return { success: false, error: error.message };
      }

      return {
        success: true,
        message: `Profile "${targetId}" deleted successfully.`,
      };
    } catch (dbErr: any) {
      return { success: false, error: dbErr.message };
    }
  }

  return {
    success: true,
    message: `Profile "${targetId}" removed locally.`,
  };
}
