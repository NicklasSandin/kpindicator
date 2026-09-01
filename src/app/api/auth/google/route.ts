import { NextRequest, NextResponse } from "next/server";

import { createGoogleAuthorization, GOOGLE_OAUTH_COOKIE, safeOAuthNext } from "@/lib/google-oauth";
import { rateLimit, requestIp } from "@/lib/rate-limit";

export async function GET(req: NextRequest) {
  const limit = rateLimit(`google-oauth:${requestIp(req.headers)}`, 20, 15 * 60 * 1000);
  if (!limit.allowed) return NextResponse.redirect(new URL("/login?error=rate_limited", req.url));
  const auth = createGoogleAuthorization();
  if (!auth) return NextResponse.redirect(new URL("/login?error=google_not_configured", req.url));
  const response = NextResponse.redirect(auth.url);
  const cookieOptions = { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax" as const, path: "/", maxAge: 10 * 60 };
  response.cookies.set(GOOGLE_OAUTH_COOKIE.state, auth.state, cookieOptions);
  response.cookies.set(GOOGLE_OAUTH_COOKIE.nonce, auth.nonce, cookieOptions);
  response.cookies.set(GOOGLE_OAUTH_COOKIE.verifier, auth.verifier, cookieOptions);
  response.cookies.set(GOOGLE_OAUTH_COOKIE.next, safeOAuthNext(req.nextUrl.searchParams.get("next")), cookieOptions);
  return response;
}
