import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export default function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;

  // Allow public access to auth pages
  if (path.startsWith("/login") || path.startsWith("/register")) {
    return NextResponse.next();
  }

  // For protected routes, use withAuth
  return (withAuth(
    function middleware(req) {
      const token = req.nextauth.token;
      const userRole = token?.role as string;
      const isBrokerPage = req.nextUrl.pathname.startsWith("/broker");
      const isFarmerPage = req.nextUrl.pathname.startsWith("/farmer");
      const isRetailerPage = req.nextUrl.pathname.startsWith("/retailer");
      const isDashboardPage = req.nextUrl.pathname.startsWith("/dashboard");

      if (isBrokerPage && userRole !== "broker") {
        return NextResponse.redirect(new URL("/login", req.url));
      }

      if (isFarmerPage && userRole !== "farmer") {
        return NextResponse.redirect(new URL("/login", req.url));
      }

      if (isRetailerPage && userRole !== "retailer") {
        return NextResponse.redirect(new URL("/login", req.url));
      }

      if (isDashboardPage) {
        // Allow admin, broker, and retailer to access dashboard
        if (!["admin", "broker", "retailer"].includes(userRole || "")) {
          return NextResponse.redirect(new URL("/login", req.url));
        }
      }

      return NextResponse.next();
    },
    {
      callbacks: {
        authorized: ({ token }) => !!token,
      },
      pages: {
        signIn: "/login",
      },
    }
  ) as any)(req);
}

export const config = {
  matcher: ["/dashboard/:path*", "/broker/:path*", "/retailer/:path*", "/farmer/:path*"],
};
