import { withAuth } from "next-auth/middleware";
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export default withAuth({
  callbacks: {
    authorized: ({ token }) => !!token,
  },
  pages: {
    signIn: '/login',
  },
});

export const config = {
  matcher: [
    "/auth/:path*",
    "/user",
    "/admin/:path*",
    "/merchant/:path*",
    "/trader/:path*",
  ],
};

export function middleware(request: NextRequest) {
  if (request.nextUrl.pathname === '/user') {
    return NextResponse.redirect(new URL('/auth/user', request.url));
  }
  return NextResponse.next();
}