import { getSessionUser } from "@/lib/auth";

export async function getApiAdmin() {
  const user = await getSessionUser();
  return user?.emailVerifiedAt && user.role === "ADMIN" ? user : null;
}
