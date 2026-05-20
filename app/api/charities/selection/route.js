import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { requireSubscriber } from '@/lib/auth';

// GET - get user's charity selection
export async function GET(req) {
  const { error, session } = await requireSubscriber();
  if (error) return error;

  const { data, error: dbError } = await supabaseAdmin
    .from('user_charities')
    .select('*, charity:charities(*)')
    .eq('user_id', session.user.id)
    .single();

  if (dbError && dbError.code !== 'PGRST116') {
    return NextResponse.json({ error: 'Failed to fetch charity selection' }, { status: 500 });
  }

  return NextResponse.json({ selection: data || null });
}

// POST/PUT - set or update user's charity selection
export async function POST(req) {
  const { error, session } = await requireSubscriber();
  if (error) return error;

  try {
    const { charityId, contributionPercentage } = await req.json();

    if (!charityId) {
      return NextResponse.json({ error: 'Charity ID required' }, { status: 400 });
    }

    const percentage = parseFloat(contributionPercentage) || 10;

    if (percentage < 10 || percentage > 100) {
      return NextResponse.json({ error: 'Contribution must be between 10% and 100%' }, { status: 400 });
    }

    const { data, error: dbError } = await supabaseAdmin
      .from('user_charities')
      .upsert(
        {
          user_id: session.user.id,
          charity_id: charityId,
          contribution_percentage: percentage,
        },
        { onConflict: 'user_id' }
      )
      .select('*, charity:charities(*)')
      .single();

    if (dbError) {
      return NextResponse.json({ error: 'Failed to update charity selection' }, { status: 500 });
    }

    return NextResponse.json({ success: true, selection: data });
  } catch (err) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
