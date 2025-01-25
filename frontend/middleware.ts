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
    "/user",  // Измените это, так как страница находится в группе (auth)
    "/admin/:path*",
    "/merchant/:path*",
    "/trader/:path*",
  ],
};