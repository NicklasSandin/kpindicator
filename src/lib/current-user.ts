import { redirect } from "next/navigation";

import { getSessionUser } from "@/lib/auth";

/**
 * Every dashboard page reads through this one function, so it's the only
 * place session handling lives. Redirects to /login when signed out, and to
 * /onboarding when signed in but the user hasn't picked a persona yet.
 */
export async function getCurrentUser() {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  if (!user.audience && user.role !== "ADMIN") redirect("/onboarding");
  return user;
}
