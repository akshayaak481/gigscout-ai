import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer, isServerSupabaseConfigured } from '@/lib/supabaseServer';
import { mapRowToProfile, mapProfileToRow, generateProfileId } from '@/lib/services/profileService';
import { FreelancerProfile } from '@/types/profile';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const profileId = searchParams.get('profileId');
    const listAll = searchParams.get('list') === 'true';

    if (!isServerSupabaseConfigured) {
      return NextResponse.json({
        success: false,
        error: 'Supabase server configuration is missing.',
      }, { status: 503 });
    }

    if (listAll) {
      const { data, error } = await supabaseServer
        .from('profiles')
        .select('*')
        .order('updated_at', { ascending: false });

      if (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        profiles: (data || []).map(mapRowToProfile),
      });
    }

    let query = supabaseServer.from('profiles').select('*');
    if (profileId) {
      query = query.eq('id', profileId);
    } else {
      query = query.order('updated_at', { ascending: false });
    }

    const { data, error } = await query.limit(1);

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    if (!data || data.length === 0) {
      return NextResponse.json({ success: false, error: 'Profile not found.' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      profile: mapRowToProfile(data[0]),
    });
  } catch (err: any) {
    console.error('Error fetching profile:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const profile = body as FreelancerProfile;

    if (!profile || !profile.name) {
      return NextResponse.json(
        { success: false, error: 'Valid profile with name is required.' },
        { status: 400 }
      );
    }

    if (!isServerSupabaseConfigured) {
      return NextResponse.json({
        success: false,
        error: 'Supabase server configuration is missing.',
      }, { status: 503 });
    }

    // Resolve profile ID based on name & existing records
    let targetId = profile.id;
    const { data: existingByName } = await supabaseServer
      .from('profiles')
      .select('id, name')
      .ilike('name', profile.name.trim())
      .limit(1);

    if (existingByName && existingByName.length > 0) {
      targetId = existingByName[0].id;
    } else if (!targetId || targetId === 'prof-active-user' || targetId.includes('video-editor')) {
      targetId = generateProfileId(profile.name);
    }

    const updatedProfile: FreelancerProfile = {
      ...profile,
      id: targetId,
      title: profile.targetRole || profile.title,
      updatedAt: new Date().toISOString(),
    };

    const row = mapProfileToRow(updatedProfile);
    const { error } = await supabaseServer
      .from('profiles')
      .upsert(row, { onConflict: 'id' });

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      profile: updatedProfile,
    });
  } catch (err: any) {
    console.error('Error saving profile:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const profileId = searchParams.get('profileId');

    if (!profileId || !profileId.trim()) {
      return NextResponse.json(
        { success: false, error: 'profileId query parameter is required for deletion.' },
        { status: 400 }
      );
    }

    const cleanId = profileId.trim();

    if (!isServerSupabaseConfigured) {
      return NextResponse.json(
        { success: false, error: 'Supabase server configuration is missing.' },
        { status: 503 }
      );
    }

    // 1. Verify that the profile exists before deleting
    const { data: existing, error: existErr } = await supabaseServer
      .from('profiles')
      .select('id, name')
      .eq('id', cleanId)
      .limit(1);

    if (existErr) {
      return NextResponse.json({ success: false, error: existErr.message }, { status: 500 });
    }

    if (!existing || existing.length === 0) {
      return NextResponse.json(
        { success: false, error: `Profile with ID "${cleanId}" not found.` },
        { status: 404 }
      );
    }

    const profileName = existing[0].name || cleanId;

    // 2. Explicitly delete dependent saved opportunities for this profile
    const { error: oppsErr } = await supabaseServer
      .from('saved_opportunities')
      .delete()
      .eq('profile_id', cleanId);

    if (oppsErr) {
      console.warn(`[Profile API] Notice deleting saved opportunities for ${cleanId}:`, oppsErr.message);
    }

    // 3. Explicitly delete dependent portfolio embeddings (RAG vector chunks) for this profile
    const { error: ragErr } = await supabaseServer
      .from('portfolio_embeddings')
      .delete()
      .eq('profile_id', cleanId);

    if (ragErr) {
      console.warn(`[Profile API] Notice deleting portfolio embeddings for ${cleanId}:`, ragErr.message);
    }

    // 4. Delete the profile record itself
    const { error: delErr } = await supabaseServer
      .from('profiles')
      .delete()
      .eq('id', cleanId);

    if (delErr) {
      return NextResponse.json({ success: false, error: delErr.message }, { status: 500 });
    }

    console.log(`[Profile API] Successfully deleted profile "${profileName}" (ID: ${cleanId}) and dependent data.`);

    return NextResponse.json({
      success: true,
      message: `Profile "${profileName}" and all associated data were successfully deleted.`,
      deletedProfileId: cleanId,
    });
  } catch (err: any) {
    console.error('Error deleting profile:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
