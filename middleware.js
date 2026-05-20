import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const { pathname } = req.nextUrl;

    // Admin routes — require admin role
    if (pathname.startsWith('/admin')) {
      if (token?.role !== 'admin') {
        return NextResponse.redirect(new URL('/dashboard', req.url));
      }
    }

    // Dashboard routes — allow if:
    //   • admin, OR
    //   • has an active subscription, OR
    //   • has ANY previous subscription history (cancelled/lapsed/etc.)
    if (pathname.startsWith('/dashboard')) {
      const allowed =
        token?.role === 'admin' ||
        token?.hasActiveSubscription ||
        token?.hasEverSubscribed;

      if (!allowed) {
        return NextResponse.redirect(new URL('/subscribe', req.url));
      }
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const { pathname } = req.nextUrl;
        if (pathname.startsWith('/dashboard') || pathname.startsWith('/admin')) {
          return !!token; // must be logged in — finer check done above
        }
        return true;
      },
    },
  }
);

export const config = {
  matcher: ['/dashboard/:path*', '/admin/:path*'],
};