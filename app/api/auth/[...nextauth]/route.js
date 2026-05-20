import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { supabaseAdmin } from '@/lib/supabase';

export const authOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },

      async authorize(credentials) {
        try {
          if (!credentials?.email || !credentials?.password) return null;

          // ── 1. Fetch user ──────────────────────────────────────────────
          const { data: user, error: userError } = await supabaseAdmin
            .from('users')
            .select('id, email, password_hash, first_name, last_name, avatar_url, role, is_active')
            .eq('email', credentials.email.toLowerCase().trim())
            .eq('is_active', true)
            .single();

          if (userError || !user) return null;

          // ── 2. Verify password ─────────────────────────────────────────
          const isValid = await bcrypt.compare(
            credentials.password,
            user.password_hash,
          );
          if (!isValid) return null;

          // ── 3. Fetch active subscription separately ────────────────────
          //  (avoids the subscriptions?.find is not a function error caused
          //   by Supabase collapsing a joined relation into an object instead
          //   of an array when the parent row is fetched via .single())
          const { data: activeSub } = await supabaseAdmin
            .from('subscriptions')
            .select('id, plan, status, current_period_end')
            .eq('user_id', user.id)
            .eq('status', 'active')
            .maybeSingle(); // returns null instead of error when no row found

          // ── 4. Check if user has ANY subscription history ─────────────
          const { count: subCount } = await supabaseAdmin
            .from('subscriptions')
            .select('id', { count: 'exact', head: true })
            .eq('user_id', user.id);

          return {
            id: user.id,
            email: user.email,
            name: `${user.first_name ?? ''} ${user.last_name ?? ''}`.trim(),
            role: user.role,
            redirect:user.role === 'admin' ? '/admin' : '/dashboard',
            avatar: user.avatar_url ?? null,
            hasActiveSubscription: !!activeSub || user.role === 'admin',
            hasEverSubscribed: (subCount ?? 0) > 0 || user.role === 'admin',
            subscriptionPlan: activeSub?.plan ?? null,
            subscriptionEnd: activeSub?.current_period_end ?? null,
          };
        } catch (err) {
          console.error('[NextAuth] authorize error:', err);
          return null;
        }
      },
    }),
  ],

  callbacks: {
    // ── jwt: called on sign-in and on every session access ──────────────
    async jwt({ token, user, trigger, session }) {
      // A. Initial sign-in — copy user fields into the token
      if (user) {
        token.id                    = user.id;
        token.role                  = user.role;
        token.avatar                = user.avatar;
        token.hasActiveSubscription = user.hasActiveSubscription;
        token.hasEverSubscribed     = user.hasEverSubscribed;
        token.subscriptionPlan      = user.subscriptionPlan;
        token.subscriptionEnd       = user.subscriptionEnd;
      }

      // B. Client called update() — merge the supplied session data
      if (trigger === 'update' && session) {
        if (session.avatar !== undefined) token.avatar = session.avatar;
        if (session.name   !== undefined) token.name   = session.name;
      }

      // C. Refresh subscription status from DB on every jwt() call
      //    so the token never goes stale after a subscription change
      if (token?.id) {
        const { data: activeSub } = await supabaseAdmin
          .from('subscriptions')
          .select('plan, status, current_period_end')
          .eq('user_id', token.id)
          .eq('status', 'active')
          .maybeSingle();

        token.hasActiveSubscription = !!activeSub || token.role === 'admin';
        token.subscriptionPlan      = activeSub?.plan ?? null;
        token.subscriptionEnd       = activeSub?.current_period_end ?? null;

        // Keep hasEverSubscribed up-to-date (admin always true)
        if (token.role === 'admin') {
          token.hasEverSubscribed = true;
        } else if (!token.hasEverSubscribed) {
          // Only hit DB if not already true — once true it stays true
          const { count: subCount } = await supabaseAdmin
            .from('subscriptions')
            .select('id', { count: 'exact', head: true })
            .eq('user_id', token.id);
          token.hasEverSubscribed = (subCount ?? 0) > 0;
        }
      }

      return token;
    },

    // ── session: shapes what getServerSession / useSession return ────────
    async session({ session, token }) {
      if (token) {
        session.user.id                    = token.id;
        session.user.role                  = token.role;
        session.user.avatar                = token.avatar;
        session.user.hasActiveSubscription = token.hasActiveSubscription;
        session.user.hasEverSubscribed     = token.hasEverSubscribed;
        session.user.subscriptionPlan      = token.subscriptionPlan;
        session.user.subscriptionEnd       = token.subscriptionEnd;
      }
      return session;
    },
  },

  pages: {
    signIn: '/login',
    error:  '/login',
  },

  session: {
    strategy: 'jwt',
    maxAge:   30 * 24 * 60 * 60, // 30 days
  },

  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };