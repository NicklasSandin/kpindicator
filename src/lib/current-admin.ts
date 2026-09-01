import { redirect } from "next/navigation";

import { getSessionUser } from "@/lib/auth";

/**
 * Same pattern as getCurrentUser() — the /admin section is internal-only.
 * Signed-out visitors go to /login; signed-in non-admins go to /dashboard
 * rather than seeing an error, since a client landing here is a routing
 * mistake, not an auth failure they need to act on.
 */
export async function getCurrentAdmin() {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  if (!user.emailVerifiedAt) redirect("/verify-email");
  if (user.role !== "ADMIN") redirect("/dashboard");
  return user;
}
