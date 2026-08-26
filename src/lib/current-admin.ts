import { prisma } from "@/lib/prisma";

/**
 * Placeholder for real auth, same pattern as getCurrentUser() — the /admin
 * section is internal-only (WhatHits' own team tracking their outbound
 * marketing), not something a client should ever reach. There's no
 * login/role gate wired up yet; swap this for a session + role==="ADMIN"
 * check when auth is added.
 */
const DEMO_ADMIN_EMAIL = "ops@whathits.co";

export async function getCurrentAdmin() {
  const admin = await prisma.user.findUnique({ where: { email: DEMO_ADMIN_EMAIL } });
  if (!admin) {
    throw new Error(`Demo admin not found. Run "npm run db:seed" to populate the database.`);
  }
  return admin;
}
