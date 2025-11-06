import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const isAuth = !!token;
    const userRole = token?.role as string;
    const isAuthPage =
      req.nextUrl.pathname.startsWith("/login") ||
      req.nextUrl.pathname.startsWith("/signup");
    const isBrokerPage = req.nextUrl.pathname.startsWith("/broker");
    const isRetailerPage = req.nextUrl.pathname.startsWith("/retailer");
    const isDashboardPage = req.nextUrl.pathname.startsWith("/dashboard");

    if (isAuthPage) {
      if (isAuth) {
        // Redirect based on role
        if (userRole === "broker") {
          return NextResponse.redirect(new URL("/broker/dashboard", req.url));
        } else if (userRole === "retailer") {
          return NextResponse.redirect(new URL("/retailer/vegetables", req.url));
        }
        return NextResponse.redirect(new URL("/dashboard", req.url));
      }
      return null;
    }

    if (isBrokerPage) {
      if (!isAuth) {
        return NextResponse.redirect(new URL("/login", req.url));
      }
      if (userRole !== "broker") {
        return NextResponse.redirect(new URL("/", req.url));
      }
    }

    if (isRetailerPage) {
      if (!isAuth) {
        return NextResponse.redirect(new URL("/login", req.url));
      }
      if (userRole !== "retailer") {
        return NextResponse.redirect(new URL("/", req.url));
      }
    }

    if (isDashboardPage) {
      if (!isAuth) {
        return NextResponse.redirect(new URL("/login", req.url));
      }
      // Allow admin, broker, and retailer to access dashboard
      if (!["admin", "broker", "retailer"].includes(userRole || "")) {
        return NextResponse.redirect(new URL("/", req.url));
      }
    }

    return null;
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
);

export const config = {
  matcher: ["/dashboard/:path*", "/broker/:path*", "/retailer/:path*", "/login", "/signup"],
};
