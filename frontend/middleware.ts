import { withAuth } from "next-auth/middleware";

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
    "/user",
    "/admin/:path*",
    "/merchant/:path*",
    "/trader/:path*",
  ],
};