import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

import { createSession } from "@/lib/auth";
import {
  constantEqual,
  exchangeGoogleCode,
  GOOGLE_OAUTH_COOKIE,
  safeOAuthNext,
  verifyGoogleIdToken,
} from "@/lib/google-oauth";
import { prisma } from "@/lib/prisma";

function loginError(req: NextRequest, code: string) {
  return NextResponse.redirect(new URL(`/login?error=${encodeURIComponent(code)}`, req.url));
}

export async function GET(req: NextRequest) {
  const error = req.nextUrl.searchParams.get("error");
  if (error) return loginError(req, "google_denied");

  const code = req.nextUrl.searchParams.get("code");
  const state = req.nextUrl.searchParams.get("state");
  const cookieStore = await cookies();
  const expectedState = cookieStore.get(GOOGLE_OAUTH_COOKIE.state)?.value;
  const nonce = cookieStore.get(GOOGLE_OAUTH_COOKIE.nonce)?.value;
  const verifier = cookieStore.get(GOOGLE_OAUTH_COOKIE.verifier)?.value;
  const requestedNext = safeOAuthNext(cookieStore.get(GOOGLE_OAUTH_COOKIE.next)?.value ?? null);

  for (const name of Object.values(GOOGLE_OAUTH_COOKIE)) cookieStore.delete(name);

  if (!code || !state || !expectedState || !nonce || !verifier || !constantEqual(state, expectedState)) {
    return loginError(req, "google_state_invalid");
  }

  try {
    const idToken = await exchangeGoogleCode(code, verifier);
    const profile = await verifyGoogleIdToken(idToken, nonce);

    const user = await prisma.$transaction(async (tx) => {
      const account = await tx.oAuthAccount.findUnique({
        where: { provider_providerAccountId: { provider: "google", providerAccountId: profile.sub } },
        include: { user: true },
      });
      if (account) return account.user;

      const existing = await tx.user.findUnique({
        where: { email: profile.email },
        include: { oauthAccounts: { where: { provider: "google" } } },
      });
      if (existing?.oauthAccounts.length) throw new Error("A different Google account is already linked.");

      if (existing) {
        await tx.oAuthAccount.create({
          data: { userId: existing.id, provider: "google", providerAccountId: profile.sub },
        });
        return tx.user.update({
          where: { id: existing.id },
          data: { emailVerifiedAt: existing.emailVerifiedAt ?? new Date() },
        });
      }

      return tx.user.create({
        data: {
          email: profile.email,
          name: profile.name,
          emailVerifiedAt: new Date(),
          oauthAccounts: { create: { provider: "google", providerAccountId: profile.sub } },
          memberships: {
            create: {
              role: "OWNER",
              organization: {
                create: {
                  name: `${profile.name}'s team`,
                  auditLogs: {
                    create: {
                      actorName: profile.name,
                      action: "TEAM_CREATED",
                      target: `${profile.name}'s team`,
                    },
                  },
                },
              },
            },
          },
        },
      });
    });

    await createSession(user.id);
    const fallback = user.role === "ADMIN" ? "/admin" : user.audience ? "/dashboard" : "/onboarding";
    return NextResponse.redirect(new URL(requestedNext || fallback, req.url));
  } catch (oauthError) {
    console.error("[google-oauth] Callback failed", oauthError);
    return loginError(req, "google_failed");
  }
}
