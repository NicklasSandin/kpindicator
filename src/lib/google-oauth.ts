import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import { createRemoteJWKSet, jwtVerify } from "jose";

export const GOOGLE_OAUTH_COOKIE = {
  state: "kp_google_state",
  nonce: "kp_google_nonce",
  verifier: "kp_google_verifier",
  next: "kp_google_next",
} as const;

const GOOGLE_AUTHORIZATION_ENDPOINT = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN_ENDPOINT = "https://oauth2.googleapis.com/token";
const GOOGLE_JWKS = createRemoteJWKSet(new URL("https://www.googleapis.com/oauth2/v3/certs"));

export function googleOAuthConfig() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
  if (!clientId || !clientSecret || !siteUrl || siteUrl.endsWith("...")) return null;
  return {
    clientId,
    clientSecret,
    redirectUri: `${siteUrl.replace(/\/$/, "")}/api/auth/google/callback`,
  };
}

export function createGoogleAuthorization() {
  const config = googleOAuthConfig();
  if (!config) return null;
  const state = randomBytes(32).toString("base64url");
  const nonce = randomBytes(32).toString("base64url");
  const verifier = randomBytes(48).toString("base64url");
  const challenge = createHash("sha256").update(verifier).digest("base64url");
  const url = new URL(GOOGLE_AUTHORIZATION_ENDPOINT);
  url.search = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: config.redirectUri,
    response_type: "code",
    scope: "openid email profile",
    state,
    nonce,
    code_challenge: challenge,
    code_challenge_method: "S256",
    prompt: "select_account",
  }).toString();
  return { url, state, nonce, verifier };
}

export function safeOAuthNext(value: string | null) {
  return value && value.startsWith("/") && !value.startsWith("//") ? value : "";
}

export function constantEqual(left: string, right: string) {
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function exchangeGoogleCode(code: string, verifier: string) {
  const config = googleOAuthConfig();
  if (!config) throw new Error("Google login is not configured.");
  const response = await fetch(GOOGLE_TOKEN_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: config.clientId,
      client_secret: config.clientSecret,
      redirect_uri: config.redirectUri,
      grant_type: "authorization_code",
      code_verifier: verifier,
    }),
    cache: "no-store",
  });
  const tokens = await response.json().catch(() => ({})) as { id_token?: string; error?: string };
  if (!response.ok || !tokens.id_token) throw new Error(tokens.error || "Google token exchange failed.");
  return tokens.id_token;
}

export async function verifyGoogleIdToken(idToken: string, expectedNonce: string) {
  const config = googleOAuthConfig();
  if (!config) throw new Error("Google login is not configured.");
  const { payload } = await jwtVerify(idToken, GOOGLE_JWKS, {
    issuer: ["https://accounts.google.com", "accounts.google.com"],
    audience: config.clientId,
    requiredClaims: ["sub", "email", "email_verified", "nonce"],
  });
  if (typeof payload.nonce !== "string" || !constantEqual(payload.nonce, expectedNonce)) {
    throw new Error("Google login nonce mismatch.");
  }
  if (payload.email_verified !== true || typeof payload.email !== "string" || typeof payload.sub !== "string") {
    throw new Error("Google did not return a verified email address.");
  }
  return {
    sub: payload.sub,
    email: payload.email.trim().toLowerCase(),
    name: typeof payload.name === "string" && payload.name.trim() ? payload.name.trim() : payload.email.split("@")[0],
  };
}
