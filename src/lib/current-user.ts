import { prisma } from "@/lib/prisma";

/**
 * Placeholder for real auth (e.g. NextAuth, Clerk). The dashboard is a
 * client-portal preview — it reads real rows from the database, but there's
 * no session/login flow wired up yet. Swap this for a session lookup when
 * auth is added; every dashboard page already reads through this one
 * function, so that's the only place that needs to change.
 */
const DEMO_USER_EMAIL = "jordan@northbeamstudio.co";

export async function getCurrentUser() {
  const user = await prisma.user.findUnique({ where: { email: DEMO_USER_EMAIL } });
  if (!user) {
    throw new Error(
      `Demo user not found. Run "npm run db:seed" to populate the database.`,
    );
  }
  return user;
}
