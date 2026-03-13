import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

const AUTH_COOKIE = "pa_token";
const PROTECTED_PREFIXES = [
  "/dashboard",
  "/organizations",
  "/cities",
  "/wards",
  "/zones",
  "/users",
  "/households",
  "/bulk-generators",
  "/workers",
  "/vehicles",
  "/routes",
  "/route-stops",
  "/shifts",
  "/facilities",
  "/pickup-tasks",
  "/pickup-logs",
  "/batches",
  "/transfers",
  "/facility-receipts",
  "/processing-records",
  "/landfill-records",
  "/recovery-certificates",
  "/reports",
  "/environmental-summaries",
  "/carbon-ledger",
  "/worker",
];

function isProtectedPath(pathname: string): boolean {
  return PROTECTED_PREFIXES.some((path) => pathname === path || pathname.startsWith(`${path}/`));
}

export function proxy(request: NextRequest) {
  const tokenCookie = request.cookies.get(AUTH_COOKIE)?.value;
  const isAuthenticated = tokenCookie === "1";
  const { pathname } = request.nextUrl;

  if (pathname === "/login" && isAuthenticated) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  if (isProtectedPath(pathname) && !isAuthenticated) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/login", "/dashboard/:path*", "/organizations/:path*", "/cities/:path*", "/wards/:path*", "/zones/:path*", "/users/:path*", "/households/:path*", "/bulk-generators/:path*", "/workers/:path*", "/vehicles/:path*", "/routes/:path*", "/route-stops/:path*", "/shifts/:path*", "/facilities/:path*", "/pickup-tasks/:path*", "/pickup-logs/:path*", "/batches/:path*", "/transfers/:path*", "/facility-receipts/:path*", "/processing-records/:path*", "/landfill-records/:path*", "/recovery-certificates/:path*", "/reports/:path*", "/environmental-summaries/:path*", "/carbon-ledger/:path*", "/worker/:path*"],
};
