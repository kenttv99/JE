// frontend/src/middleware.ts
import { NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { withAuth } from 'next-auth/middleware';

export default withAuth(
  async function middleware(req) {
    const token = await getToken({ req });
    const pathname = req.nextUrl.pathname;

    // Protected routes check only
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
      authorized: ({ token, req }) => {
        // Allow access to login page regardless of auth status
        if (req.nextUrl.pathname === '/login') return true;
        // Require token for protected routes
        return !!token;
      },
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