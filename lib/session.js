import { getServerSession } from "next-auth/next";
import { authOptions } from "./auth";

export async function getCurrentUser() {
  const session = await getServerSession(authOptions);
  return session?.user || null;
}

export function requireRole(user, roles) {
  if (!user || !roles.includes(user.role)) {
    return false;
  }
  return true;
}
