// frontend/src/middleware.ts
import { NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { withAuth } from 'next-auth/middleware';

export default withAuth(
  async function middleware(req) {
    const token = await getToken({ req });
    const pathname = req.nextUrl.pathname;

    // If token exists but trying to access login page, redirect based on role
    if (token && pathname === '/login') {
      const role = token.role as string;
      const redirectPath = role === 'trader' ? '/trader/profile' : `/${role}`;
      return NextResponse.redirect(new URL(redirectPath, req.url));
    }

    // Protected routes check
    if (token) {
      const role = token.role as string;
      
      // Role-based access control
      if (pathname.startsWith('/trader') && role !== 'trader') {
        return NextResponse.redirect(new URL('/', req.url));
      }
      if (pathname.startsWith('/admin') && role !== 'admin') {
        return NextResponse.redirect(new URL('/', req.url));
      }
      if (pathname.startsWith('/merchant') && role !== 'merchant') {
        return NextResponse.redirect(new URL('/', req.url));
      }
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
);

export const config = {
  matcher: [
    '/login',
    '/trader/:path*',
    '/admin/:path*',
    '/merchant/:path*',
  ],
};