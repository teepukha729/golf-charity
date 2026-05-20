import { NextResponse } from 'next/server';
import { requireSubscriber } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';
import { uploadBase64ToCloudinary } from '@/lib/cloudinary';

export async function POST(req) {
  const { error, session } = await requireSubscriber();
  if (error) return error;

  try {
    const { winnerId, imageData } = await req.json();

    if (!winnerId || !imageData) {
      return NextResponse.json({ error: 'Winner ID and image data required' }, { status: 400 });
    }

    // Verify the winner belongs to the user
    const { data: winner } = await supabaseAdmin
      .from('winners')
      .select('user_id, verification_status')
      .eq('id', winnerId)
      .single();

    if (!winner) {
      return NextResponse.json({ error: 'Winner record not found' }, { status: 404 });
    }

    if (winner.user_id !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (winner.verification_status === 'approved') {
      return NextResponse.json({ error: 'Already approved' }, { status: 400 });
    }

    // Upload to Cloudinary in golf_charity folder
    const uploadResult = await uploadBase64ToCloudinary(imageData, 'golf_charity');

    // Update winner record with proof URL
    const { data: updated, error: dbError } = await supabaseAdmin
      .from('winners')
      .update({
        proof_url: uploadResult.secure_url,
        verification_status: 'pending',
      })
      .eq('id', winnerId)
      .select()
      .single();

    if (dbError) {
      return NextResponse.json({ error: 'Failed to update proof' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      proofUrl: uploadResult.secure_url,
      winner: updated,
    });
  } catch (err) {
    console.error('Upload error:', err);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}
