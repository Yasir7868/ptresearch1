/**
 * proxy.ts — Next 16's request proxy (formerly middleware), scoped to the
 * admin panel only. The storefront never runs through it.
 *
 * It does two cheap things:
 *   1. Signed-out visitors (no session cookie) are redirected to the admin
 *      sign-in page, with the page they wanted kept in ?next=. This is an
 *      OPTIMISTIC check — the session is verified against the database by
 *      lib/admin/auth.ts on every page, Server Action and API route.
 *   2. Every admin response gets noindex and a strict referrer policy (invite
 *      and reset links carry a token in the URL that must not leak).
 *
 * It also forwards the requested path to the page as x-pt-admin-path so an
 * expired session can send the person back where they were after sign-in.
 */

import { NextResponse, type NextRequest } from "next/server";

/** Must match SESSION_COOKIE in lib/admin/session.ts (dev and production names). */
const SESSION_COOKIES = ["__Host-pt_admin", "pt_admin"];

/** Admin pages that work without a session. */
const PUBLIC_PREFIXES = ["/admin/login", "/admin/setup", "/admin/invite/", "/admin/reset/"];

function secure(response: NextResponse, pathname: string): NextResponse {
  response.headers.set("X-Robots-Tag", "noindex, nofollow");
  response.headers.set(
    "Referrer-Policy",
    pathname.startsWith("/admin/invite/") || pathname.startsWith("/admin/reset/")
      ? "no-referrer"
      : "same-origin"
  );
  response.headers.set("X-Frame-Options", "DENY");
  return response;
}

export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const hasSession = SESSION_COOKIES.some((name) => request.cookies.has(name));
  const isPublic = PUBLIC_PREFIXES.some((prefix) => pathname.startsWith(prefix));

  if (!hasSession && !isPublic) {
    if (pathname.startsWith("/api/")) {
      return secure(NextResponse.json({ error: "Not signed in." }, { status: 401 }), pathname);
    }
    const login = new URL("/admin/login", request.url);
    if (pathname !== "/admin") login.searchParams.set("next", `${pathname}${search}`);
    return secure(NextResponse.redirect(login), pathname);
  }

  const headers = new Headers(request.headers);
  headers.set("x-pt-admin-path", `${pathname}${search}`);
  return secure(NextResponse.next({ request: { headers } }), pathname);
}

export const config = {
  matcher: ["/admin", "/admin/:path*", "/api/admin/:path*"],
};
