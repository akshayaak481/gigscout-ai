import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer, isServerSupabaseConfigured } from '@/lib/supabaseServer';
import { Opportunity } from '@/types/opportunity';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const profileId = searchParams.get('profileId') || 'prof-active-user';

    if (!isServerSupabaseConfigured) {
      return NextResponse.json({
        success: true,
        opportunities: [],
        warning: 'Supabase server configuration is missing.',
      });
    }

    // 1. Try querying dedicated saved_opportunities table
    const { data: tableData, error: tableErr } = await supabaseServer
      .from('saved_opportunities')
      .select('opportunity_id, opportunity_data, saved_at')
      .eq('profile_id', profileId)
      .order('saved_at', { ascending: false });

    if (!tableErr && tableData && tableData.length > 0) {
      const opportunities: Opportunity[] = tableData
        .map((row: any) => row.opportunity_data)
        .filter(Boolean);

      return NextResponse.json({
        success: true,
        totalSaved: opportunities.length,
        opportunities,
        source: 'saved_opportunities_table',
      });
    }

    // 2. Resilient fallback: Query active profile from Supabase profiles table
    const { data: profRows, error: profErr } = await supabaseServer
      .from('profiles')
      .select('id, portfolio_items')
      .eq('id', profileId)
      .limit(1);

    if (!profErr && profRows && profRows.length > 0) {
      const pItems = Array.isArray(profRows[0].portfolio_items) ? profRows[0].portfolio_items : [];
      const savedItems = pItems
        .filter((item: any) => item && item.__type === 'saved_opportunity')
        .map((item: any) => item.data as Opportunity);

      return NextResponse.json({
        success: true,
        totalSaved: savedItems.length,
        opportunities: savedItems,
        source: 'profiles_table',
      });
    }

    return NextResponse.json({
      success: true,
      totalSaved: 0,
      opportunities: [],
    });
  } catch (err: any) {
    console.error('Error fetching saved opportunities:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to fetch saved opportunities.' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { profileId, opportunity } = body;

    if (!profileId || !opportunity || !opportunity.id) {
      return NextResponse.json(
        { success: false, error: 'profileId and a valid opportunity object are required.' },
        { status: 400 }
      );
    }

    if (!isServerSupabaseConfigured) {
      return NextResponse.json({
        success: true,
        message: 'Saved locally (Supabase not configured)',
      });
    }

    // 1. Persist to dedicated saved_opportunities table in Supabase
    const { error: tableErr } = await supabaseServer
      .from('saved_opportunities')
      .upsert(
        {
          profile_id: profileId,
          opportunity_id: opportunity.id,
          opportunity_data: opportunity,
          saved_at: new Date().toISOString(),
        },
        { onConflict: 'profile_id,opportunity_id' }
      );

    // 2. Also sync to profiles table in Supabase to ensure persistence across all configurations
    try {
      const { data: profRows } = await supabaseServer
        .from('profiles')
        .select('id, portfolio_items')
        .eq('id', profileId)
        .limit(1);

      if (profRows && profRows.length > 0) {
        const existing = Array.isArray(profRows[0].portfolio_items) ? profRows[0].portfolio_items : [];
        const nonSaved = existing.filter((item: any) => item && item.__type !== 'saved_opportunity');
        const savedList = existing
          .filter((item: any) => item && item.__type === 'saved_opportunity')
          .filter((item: any) => item.opportunityId !== opportunity.id);

        const updatedPortfolioItems = [
          {
            __type: 'saved_opportunity',
            opportunityId: opportunity.id,
            data: opportunity,
            savedAt: new Date().toISOString(),
          },
          ...savedList,
          ...nonSaved,
        ];

        await supabaseServer
          .from('profiles')
          .update({
            portfolio_items: updatedPortfolioItems,
            updated_at: new Date().toISOString(),
          })
          .eq('id', profileId);
      }
    } catch (profSyncErr) {
      console.warn('Profiles table saved sync notice:', profSyncErr);
    }

    return NextResponse.json({
      success: true,
      message: 'Opportunity saved successfully.',
    });
  } catch (err: any) {
    console.error('Error saving opportunity:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to save opportunity.' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { profileId, opportunityId } = body;

    if (!profileId || !opportunityId) {
      return NextResponse.json(
        { success: false, error: 'profileId and opportunityId are required.' },
        { status: 400 }
      );
    }

    if (!isServerSupabaseConfigured) {
      return NextResponse.json({
        success: true,
        message: 'Unsaved locally (Supabase not configured)',
      });
    }

    // 1. Delete from dedicated saved_opportunities table in Supabase
    await supabaseServer
      .from('saved_opportunities')
      .delete()
      .eq('profile_id', profileId)
      .eq('opportunity_id', opportunityId);

    // 2. Remove from profiles table in Supabase
    try {
      const { data: profRows } = await supabaseServer
        .from('profiles')
        .select('id, portfolio_items')
        .eq('id', profileId)
        .limit(1);

      if (profRows && profRows.length > 0) {
        const existing = Array.isArray(profRows[0].portfolio_items) ? profRows[0].portfolio_items : [];
        const updatedPortfolioItems = existing.filter(
          (item: any) => !(item && item.__type === 'saved_opportunity' && item.opportunityId === opportunityId)
        );

        await supabaseServer
          .from('profiles')
          .update({
            portfolio_items: updatedPortfolioItems,
            updated_at: new Date().toISOString(),
          })
          .eq('id', profileId);
      }
    } catch (profSyncErr) {
      console.warn('Profiles table unsave sync notice:', profSyncErr);
    }

    return NextResponse.json({
      success: true,
      message: 'Opportunity removed from saved list.',
    });
  } catch (err: any) {
    console.error('Error deleting saved opportunity:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to unsave opportunity.' },
      { status: 500 }
    );
  }
}
