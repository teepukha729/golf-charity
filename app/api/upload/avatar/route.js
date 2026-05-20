import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';
import { uploadBase64ToCloudinary } from '@/lib/cloudinary';

export async function POST(req) {
  const { error, session } = await requireAuth();
  if (error) return error;

  try {
    const { imageData } = await req.json();

    if (!imageData) {
      return NextResponse.json({ error: 'Image data required' }, { status: 400 });
    }

    const uploadResult = await uploadBase64ToCloudinary(imageData, 'golf_charity/avatars');

    await supabaseAdmin
      .from('users')
      .update({ avatar_url: uploadResult.secure_url })
      .eq('id', session.user.id);

    return NextResponse.json({
      success: true,
      avatarUrl: uploadResult.secure_url,
    });
  } catch (err) {
    console.error('Avatar upload error:', err);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}
