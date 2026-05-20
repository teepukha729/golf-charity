import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { requireSubscriber } from '@/lib/auth';

export async function GET(req) {
  const { error, session } = await requireSubscriber();
  if (error) return error;

  const { data: entries, error: dbError } = await supabaseAdmin
    .from('draw_entries')
    .select('*, draw:draws(*)')
    .eq('user_id', session.user.id)
    .order('created_at', { ascending: false })
    .limit(20);

  if (dbError) {
    return NextResponse.json({ error: 'Failed to fetch entries' }, { status: 500 });
  }

  return NextResponse.json({ entries });
}
