// frontend/middleware.ts
import { NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { withAuth } from 'next-auth/middleware';

export default withAuth(
  async function middleware(req) {
    const token = await getToken({ req });
    const pathname = req.nextUrl.pathname;

    // If trying to access protected routes without authentication, redirect to login
    if (!token && (
      pathname.startsWith('/trader') ||
      pathname.startsWith('/admin') ||
      pathname.startsWith('/merchant')
    )) {
      return NextResponse.redirect(new URL('/login', req.url));
    }

    // If authenticated but trying to access wrong role's routes
    if (token) {
      const role = token.role as string;
      
      // Role-based access control with specific redirects
      if (pathname.startsWith('/trader') && role !== 'trader') {
        return NextResponse.redirect(new URL(`/${role}`, req.url));
      }
      if (pathname.startsWith('/admin') && role !== 'admin') {
        return NextResponse.redirect(new URL(`/${role}`, req.url));
      }
      if (pathname.startsWith('/merchant') && role !== 'merchant') {
        return NextResponse.redirect(new URL(`/${role}`, req.url));
      }
    }

    // Allow the request to proceed
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        // Allow access to login page always
        if (req.nextUrl.pathname === '/login') return true;
        
        // For protected routes, require token
        if (
          req.nextUrl.pathname.startsWith('/trader') ||
          req.nextUrl.pathname.startsWith('/admin') ||
          req.nextUrl.pathname.startsWith('/merchant')
        ) {
          return !!token;
        }
        
        // Allow access to public routes
        return true;
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