import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_FROM,
    pass: process.env.EMAIL_PASS,
  },
});

export const sendEmail = async ({ to, subject, html }) => {
  const mailOptions = {
    from: `"Golf Charity Platform" <${process.env.EMAIL_FROM}>`,
    to,
    subject,
    html,
  };

  try {
    await transporter.sendMail(mailOptions);
    return { success: true };
  } catch (error) {
    console.error('Email error:', error);
    return { success: false, error };
  }
};

export const emailTemplates = {
  welcome: (name) => ({
    subject: 'Welcome to Golf Charity Platform!',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #1a472a, #2d6a4f); padding: 40px; text-align: center;">
          <h1 style="color: white; margin: 0;">⛳ Golf Charity Platform</h1>
        </div>
        <div style="padding: 40px; background: #f9f9f9;">
          <h2>Welcome, ${name}!</h2>
          <p>Thank you for joining Golf Charity Platform. Your account has been created successfully.</p>
          <p>Start by entering your golf scores and selecting a charity to support!</p>
          <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard" 
             style="background: #1a472a; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; display: inline-block; margin-top: 16px;">
            Go to Dashboard
          </a>
        </div>
      </div>
    `,
  }),

  subscriptionActive: (name, plan) => ({
    subject: 'Subscription Activated - Golf Charity Platform',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #1a472a, #2d6a4f); padding: 40px; text-align: center;">
          <h1 style="color: white; margin: 0;">⛳ Golf Charity Platform</h1>
        </div>
        <div style="padding: 40px; background: #f9f9f9;">
          <h2>Subscription Active!</h2>
          <p>Hi ${name}, your ${plan} subscription is now active. You can now participate in monthly draws!</p>
          <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard" 
             style="background: #1a472a; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; display: inline-block; margin-top: 16px;">
            View Dashboard
          </a>
        </div>
      </div>
    `,
  }),

  drawResults: (name, matchType, prize) => ({
    subject: '🎉 Congratulations! You Won in the Golf Draw!',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #1a472a, #2d6a4f); padding: 40px; text-align: center;">
          <h1 style="color: white; margin: 0;">🏆 You're a Winner!</h1>
        </div>
        <div style="padding: 40px; background: #f9f9f9;">
          <h2>Congratulations ${name}!</h2>
          <p>You achieved a <strong>${matchType}</strong> in the latest draw!</p>
          <p>Prize Amount: <strong>£${prize}</strong></p>
          <p>Please upload your proof of scores to claim your prize.</p>
          <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/winnings" 
             style="background: #1a472a; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; display: inline-block; margin-top: 16px;">
            Claim Your Prize
          </a>
        </div>
      </div>
    `,
  }),

  winnerVerified: (name, status, prize) => ({
    subject: `Prize Verification ${status === 'approved' ? 'Approved' : 'Update'} - Golf Charity Platform`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #1a472a, #2d6a4f); padding: 40px; text-align: center;">
          <h1 style="color: white; margin: 0;">Golf Charity Platform</h1>
        </div>
        <div style="padding: 40px; background: #f9f9f9;">
          <h2>Prize Verification ${status === 'approved' ? '✅ Approved' : '❌ Update'}</h2>
          <p>Hi ${name}, your prize verification has been ${status}.</p>
          ${status === 'approved' ? `<p>Your prize of <strong>£${prize}</strong> will be processed shortly.</p>` : ''}
          <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/winnings" 
             style="background: #1a472a; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; display: inline-block; margin-top: 16px;">
            View Details
          </a>
        </div>
      </div>
    `,
  }),
};
