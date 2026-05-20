import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { requireAdmin, requireSubscriber } from '@/lib/auth';
import { sendEmail, emailTemplates } from '@/lib/email';

// GET - user's winnings or admin: all winners
export async function GET(req) {
  const { error, session } = await requireSubscriber();
  if (error) return error;

  const { searchParams } = new URL(req.url);
  const isAdmin = searchParams.get('admin') === 'true';

  if (isAdmin && session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  let query = supabaseAdmin
    .from('winners')
    .select('*, user:users(id, first_name, last_name, email, avatar_url), draw:draws(name, draw_date, winning_numbers)')
    .order('created_at', { ascending: false });

  if (!isAdmin) {
    query = query.eq('user_id', session.user.id);
  }

  const { data: winners, error: dbError } = await query;

  if (dbError) {
    return NextResponse.json({ error: 'Failed to fetch winners' }, { status: 500 });
  }

  return NextResponse.json({ winners });
}

// PUT - admin: verify/update winner status
export async function PUT(req) {
  const { error, session } = await requireAdmin();
  if (error) return error;

  try {
    const body = await req.json();
    const { id, verificationStatus, paymentStatus, adminNotes } = body;

    if (!id) return NextResponse.json({ error: 'Winner ID required' }, { status: 400 });

    const updateData = {};
    if (verificationStatus) updateData.verification_status = verificationStatus;
    if (paymentStatus) updateData.payment_status = paymentStatus;
    if (adminNotes !== undefined) updateData.admin_notes = adminNotes;
    if (verificationStatus) updateData.verified_at = new Date().toISOString();
    if (paymentStatus === 'paid') updateData.paid_at = new Date().toISOString();

    const { data: winner, error: dbError } = await supabaseAdmin
      .from('winners')
      .update(updateData)
      .eq('id', id)
      .select('*, user:users(email, first_name, last_name)')
      .single();

    if (dbError) {
      return NextResponse.json({ error: 'Failed to update winner' }, { status: 500 });
    }

    // Send email notification
    if (verificationStatus && winner.user) {
      const emailTemplate = emailTemplates.winnerVerified(
        `${winner.user.first_name} ${winner.user.last_name}`,
        verificationStatus,
        winner.prize_amount.toFixed(2)
      );
      sendEmail({ to: winner.user.email, ...emailTemplate }).catch(console.error);
    }

    return NextResponse.json({ success: true, winner });
  } catch (err) {
    console.error('Winner PUT error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
