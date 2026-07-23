import { NextResponse } from "next/server";
import { getCurrentUser } from "./session";

export async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") {
    return { error: NextResponse.json({ error: "Acesso restrito ao administrador." }, { status: 403 }) };
  }
  return { user };
}
