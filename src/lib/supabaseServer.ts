import { createClient } from '@supabase/supabase-js';

const rawSupabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
// Strip trailing /rest/v1 or trailing slashes to prevent double-path routing
const supabaseUrl = rawSupabaseUrl.replace(/\/rest\/v1\/?$/i, '').replace(/\/+$/, '');

// On the server side, use SUPABASE_SERVICE_ROLE_KEY for privileged operations (ingestion, vector storage)
// Fallback to NEXT_PUBLIC_SUPABASE_ANON_KEY if service role key is not configured
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key';

const isServiceRoleValid = Boolean(
  serviceRoleKey && 
  !serviceRoleKey.includes('placeholder') && 
  !serviceRoleKey.includes('your_') &&
  serviceRoleKey.trim().length > 10
);

export const isServerSupabaseConfigured = Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_URL && 
  (isServiceRoleValid || (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY && !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.includes('placeholder'))) &&
  !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('placeholder')
);

// Server-side Supabase client (service role with RLS bypass if service role key is present)
export const supabaseServer = createClient(
  supabaseUrl, 
  isServiceRoleValid ? (serviceRoleKey as string) : anonKey,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  }
);
