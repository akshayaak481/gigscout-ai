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
