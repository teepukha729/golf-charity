import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { sendEmail } from '@/lib/email';

// Generate a 6-digit OTP
function generateOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function POST(req) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    // Check if user exists
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('id, first_name, email')
      .eq('email', email.toLowerCase())
      .single();

    if (userError || !user) {
      // Return generic success to prevent email enumeration
      return NextResponse.json({ success: true, message: 'If this email exists, an OTP has been sent.' });
    }

    const otp = generateOtp();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    // Delete any existing unused OTPs for this user
    await supabaseAdmin
      .from('password_reset_otps')
      .delete()
      .eq('user_id', user.id);

    // Insert new OTP
    const { error: insertError } = await supabaseAdmin
      .from('password_reset_otps')
      .insert({
        user_id: user.id,
        email: email.toLowerCase(),
        otp,
        expires_at: expiresAt.toISOString(),
        used: false,
      });

    if (insertError) {
      console.error('OTP insert error:', insertError);
      return NextResponse.json({ error: 'Failed to generate OTP. Please try again.' }, { status: 500 });
    }

    // Send OTP email
    await sendEmail({
      to: user.email,
      subject: 'Your Golf Charity Password Reset OTP',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #1a472a, #2d6a4f); padding: 40px; text-align: center;">
            <h1 style="color: white; margin: 0;">⛳ GolfCharity</h1>
          </div>
          <div style="padding: 40px; background: #f9f9f9;">
            <h2 style="color: #1a472a;">Password Reset Request</h2>
            <p>Hi ${user.first_name || 'there'},</p>
            <p>We received a request to reset your password. Use the OTP below to proceed:</p>
            <div style="text-align: center; margin: 32px 0;">
              <div style="display: inline-block; background: #1a472a; color: white; font-size: 36px; font-weight: bold; letter-spacing: 12px; padding: 20px 32px; border-radius: 12px;">
                ${otp}
              </div>
            </div>
            <p style="color: #666; font-size: 14px;">This OTP expires in <strong>15 minutes</strong>. If you did not request a password reset, please ignore this email.</p>
          </div>
          <div style="padding: 20px; text-align: center; color: #aaa; font-size: 12px;">
            © Golf Charity Platform
          </div>
        </div>
      `,
    });

    return NextResponse.json({ success: true, message: 'OTP sent to your email.' });
  } catch (error) {
    console.error('Forgot password error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}