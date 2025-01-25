import { withAuth } from "next-auth/middleware";

export default withAuth({
  callbacks: {
    authorized: ({ token }) => !!token,
  },
});

export const config = {
  matcher: [
    "/user",  // Changed from /profile to /user
    "/admin/:path*",
    "/merchant/:path*",
    "/trader/:path*",
  ],
};