// frontend/middleware.ts
import { NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { type NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  const token = await getToken({ req });
  const { pathname } = req.nextUrl;

  // Always allow access to login page and API routes
  if (pathname.startsWith('/api') || pathname === '/login') {
    if (token && pathname === '/login') {
      // If user is already authenticated and tries to access login, 
      // redirect to their role-specific page
      return NextResponse.redirect(new URL('/trader/profile', req.url));
    }
    return NextResponse.next();
  }

  // No token, redirect to login
  if (!token) {
    const loginUrl = new URL('/login', req.url);
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Check token expiry
  if (token.error === "RefreshAccessTokenError") {
    const loginUrl = new URL('/login', req.url);
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Role-based access control
  const role = token.role as string;
  if (pathname.startsWith('/trader') && role !== 'trader') {
    return NextResponse.redirect(new URL(`/${role}`, req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/login',
    '/trader/:path*',
    '/admin/:path*',
    '/merchant/:path*',
    '/api/auth/:path*'
  ]
};