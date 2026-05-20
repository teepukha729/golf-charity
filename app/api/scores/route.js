import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { requireSubscriber } from '@/lib/auth';

// GET - fetch user scores
export async function GET(req) {
  const { error, session } = await requireSubscriber();
  if (error) return error;

  const { searchParams } = new URL(req.url);
  const userId = searchParams.get('userId') || session.user.id;

  // Admin can view any user's scores
  if (userId !== session.user.id && session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { data: scores, error: dbError } = await supabaseAdmin
    .from('golf_scores')
    .select('*')
    .eq('user_id', userId)
    .order('played_at', { ascending: false })
    .limit(5);

  if (dbError) {
    return NextResponse.json({ error: 'Failed to fetch scores' }, { status: 500 });
  }

  return NextResponse.json({ scores });
}

// POST - add new score
export async function POST(req) {
  const { error, session } = await requireSubscriber();
  if (error) return error;

  try {
    const { score, playedAt, userId: targetUserId } = await req.json();

    const userId = (session.user.role === 'admin' && targetUserId) ? targetUserId : session.user.id;

    if (!score || !playedAt) {
      return NextResponse.json({ error: 'Score and date are required' }, { status: 400 });
    }

    if (score < 1 || score > 45) {
      return NextResponse.json({ error: 'Score must be between 1 and 45 (Stableford format)' }, { status: 400 });
    }

    // Check date is not in future
    if (new Date(playedAt) > new Date()) {
      return NextResponse.json({ error: 'Score date cannot be in the future' }, { status: 400 });
    }

    // Insert score (trigger will auto-remove oldest if > 5)
    const { data: newScore, error: dbError } = await supabaseAdmin
      .from('golf_scores')
      .insert({
        user_id: userId,
        score: parseInt(score),
        played_at: playedAt,
      })
      .select()
      .single();

    if (dbError) {
      return NextResponse.json({ error: 'Failed to add score' }, { status: 500 });
    }

    // Return updated scores
    const { data: scores } = await supabaseAdmin
      .from('golf_scores')
      .select('*')
      .eq('user_id', userId)
      .order('played_at', { ascending: false })
      .limit(5);

    return NextResponse.json({ success: true, score: newScore, scores });
  } catch (err) {
    console.error('Score POST error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT - update a score
export async function PUT(req) {
  const { error, session } = await requireSubscriber();
  if (error) return error;

  try {
    const { id, score, playedAt } = await req.json();

    if (!id || !score || !playedAt) {
      return NextResponse.json({ error: 'ID, score and date are required' }, { status: 400 });
    }

    if (score < 1 || score > 45) {
      return NextResponse.json({ error: 'Score must be between 1 and 45' }, { status: 400 });
    }

    // Verify ownership (or admin)
    const { data: existing } = await supabaseAdmin
      .from('golf_scores')
      .select('user_id')
      .eq('id', id)
      .single();

    if (!existing) {
      return NextResponse.json({ error: 'Score not found' }, { status: 404 });
    }

    if (existing.user_id !== session.user.id && session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { data: updated, error: dbError } = await supabaseAdmin
      .from('golf_scores')
      .update({ score: parseInt(score), played_at: playedAt })
      .eq('id', id)
      .select()
      .single();

    if (dbError) {
      return NextResponse.json({ error: 'Failed to update score' }, { status: 500 });
    }

    return NextResponse.json({ success: true, score: updated });
  } catch (err) {
    console.error('Score PUT error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE - delete a score
export async function DELETE(req) {
  const { error, session } = await requireSubscriber();
  if (error) return error;

  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ error: 'Score ID required' }, { status: 400 });
  }

  const { data: existing } = await supabaseAdmin
    .from('golf_scores')
    .select('user_id')
    .eq('id', id)
    .single();

  if (!existing) {
    return NextResponse.json({ error: 'Score not found' }, { status: 404 });
  }

  if (existing.user_id !== session.user.id && session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { error: dbError } = await supabaseAdmin
    .from('golf_scores')
    .delete()
    .eq('id', id);

  if (dbError) {
    return NextResponse.json({ error: 'Failed to delete score' }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
