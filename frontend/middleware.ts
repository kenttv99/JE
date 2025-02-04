// frontend/middleware.ts
import { withAuth } from "next-auth/middleware";
import { NextResponse } from 'next/server';
import { ExtendedJWT } from './src/types/auth';

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token as ExtendedJWT | null;
    const { pathname } = req.nextUrl;

    // If user is authenticated
    if (token) {
      const userRole = token.role; // Now TypeScript knows that role exists

      // Redirect from root trader page to profile
      if (pathname === '/trader') {
        return NextResponse.redirect(new URL('/trader/profile', req.url));
      }

      // If trying to access login page while authenticated
      if (pathname === '/login') {
        switch (userRole) {
          case 'trader':
            return NextResponse.redirect(new URL('/trader/profile', req.url));
          case 'admin':
            return NextResponse.redirect(new URL('/admin', req.url));
          case 'merchant':
            return NextResponse.redirect(new URL('/merchant', req.url));
          default:
            return NextResponse.redirect(new URL('/', req.url));
        }
      }

      // Role-based path protection
      if (pathname.startsWith('/trader') && userRole !== 'trader') {
        return NextResponse.redirect(new URL('/', req.url));
      }
      if (pathname.startsWith('/admin') && userRole !== 'admin') {
        return NextResponse.redirect(new URL('/', req.url));
      }
      if (pathname.startsWith('/merchant') && userRole !== 'merchant') {
        return NextResponse.redirect(new URL('/', req.url));
      }
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
    pages: {
      signIn: '/login',
    },
  }
);

export const config = {
  matcher: [
    '/login',
    '/user',
    '/admin/:path*',
    '/merchant/:path*',
    '/trader/:path*',
  ],
};