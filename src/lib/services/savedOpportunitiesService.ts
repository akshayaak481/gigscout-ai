import { Opportunity } from '@/types/opportunity';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

const LOCAL_STORAGE_KEY_PREFIX = 'gigscout_saved_opportunities_';

/**
 * Fetch all saved opportunities for the active profile from Supabase.
 */
export async function fetchSavedOpportunities(profileId?: string): Promise<Opportunity[]> {
  const pId = profileId || 'prof-active-user';

  // 1. Try fetching from API / Supabase saved_opportunities table
  try {
    const res = await fetch(`/api/opportunities/saved?profileId=${encodeURIComponent(pId)}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      cache: 'no-store',
    });

    if (res.ok) {
      const json = await res.json();
      if (json.success && Array.isArray(json.opportunities)) {
        // Sync local storage cache
        if (typeof window !== 'undefined') {
          try {
            localStorage.setItem(`${LOCAL_STORAGE_KEY_PREFIX}${pId}`, JSON.stringify(json.opportunities));
          } catch (e) {
            // Ignore quota errors
          }
        }
        return json.opportunities;
      }
    }
  } catch (apiErr) {
    console.warn('API fetchSavedOpportunities notice:', apiErr);
  }

  // 2. Direct client fallback if API is not reached
  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from('saved_opportunities')
        .select('opportunity_id, opportunity_data, saved_at')
        .eq('profile_id', pId)
        .order('saved_at', { ascending: false });

      if (!error && data && data.length > 0) {
        const opps = data
          .map((row: any) => row.opportunity_data)
          .filter(Boolean);
        return opps;
      }
    } catch (dbErr) {
      console.warn('Direct Supabase saved_opportunities read notice:', dbErr);
    }
  }

  // 3. LocalStorage persistence fallback
  if (typeof window !== 'undefined') {
    try {
      const cached = localStorage.getItem(`${LOCAL_STORAGE_KEY_PREFIX}${pId}`);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (lsErr) {
      console.warn('LocalStorage read notice:', lsErr);
    }
  }

  return [];
}

/**
 * Persist an opportunity to Supabase in saved_opportunities table.
 * Idempotent: prevents duplicate saves.
 */
export async function saveOpportunity(
  profileId: string,
  opportunity: Opportunity
): Promise<{ success: boolean; error?: string }> {
  const pId = profileId || 'prof-active-user';

  // 1. Call server API
  try {
    const res = await fetch('/api/opportunities/saved', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        profileId: pId,
        opportunity,
      }),
    });

    const json = await res.json().catch(() => ({}));
    if (res.ok && json.success) {
      updateLocalCache(pId, opportunity, 'add');
      return { success: true };
    }
  } catch (apiErr) {
    console.warn('API saveOpportunity notice:', apiErr);
  }

  // 2. Direct client fallback
  if (isSupabaseConfigured) {
    try {
      const { error } = await supabase
        .from('saved_opportunities')
        .upsert(
          {
            profile_id: pId,
            opportunity_id: opportunity.id,
            opportunity_data: opportunity,
            saved_at: new Date().toISOString(),
          },
          { onConflict: 'profile_id,opportunity_id' }
        );

      if (!error) {
        updateLocalCache(pId, opportunity, 'add');
        return { success: true };
      }
    } catch (dbErr) {
      console.warn('Direct Supabase save notice:', dbErr);
    }
  }

  // 3. Local storage fallback
  updateLocalCache(pId, opportunity, 'add');
  return { success: true };
}

/**
 * Remove a saved opportunity record from Supabase.
 */
export async function unsaveOpportunity(
  profileId: string,
  opportunityId: string
): Promise<{ success: boolean; error?: string }> {
  const pId = profileId || 'prof-active-user';

  // 1. Call server API
  try {
    const res = await fetch('/api/opportunities/saved', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        profileId: pId,
        opportunityId,
      }),
    });

    const json = await res.json().catch(() => ({}));
    if (res.ok && json.success) {
      updateLocalCache(pId, { id: opportunityId } as Opportunity, 'remove');
      return { success: true };
    }
  } catch (apiErr) {
    console.warn('API unsaveOpportunity notice:', apiErr);
  }

  // 2. Direct client fallback
  if (isSupabaseConfigured) {
    try {
      const { error } = await supabase
        .from('saved_opportunities')
        .delete()
        .eq('profile_id', pId)
        .eq('opportunity_id', opportunityId);

      if (!error) {
        updateLocalCache(pId, { id: opportunityId } as Opportunity, 'remove');
        return { success: true };
      }
    } catch (dbErr) {
      console.warn('Direct Supabase unsave notice:', dbErr);
    }
  }

  // 3. Local storage fallback
  updateLocalCache(pId, { id: opportunityId } as Opportunity, 'remove');
  return { success: true };
}

function updateLocalCache(profileId: string, opp: Opportunity, action: 'add' | 'remove') {
  if (typeof window === 'undefined') return;
  try {
    const key = `${LOCAL_STORAGE_KEY_PREFIX}${profileId}`;
    const cached = localStorage.getItem(key);
    let list: Opportunity[] = cached ? JSON.parse(cached) : [];
    if (!Array.isArray(list)) list = [];

    if (action === 'add') {
      if (!list.some((item) => item.id === opp.id)) {
        list = [opp, ...list];
      }
    } else {
      list = list.filter((item) => item.id !== opp.id);
    }

    localStorage.setItem(key, JSON.stringify(list));
  } catch (e) {
    // Ignore storage quota errors
  }
}
