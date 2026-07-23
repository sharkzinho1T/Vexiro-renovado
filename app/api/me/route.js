import { NextResponse } from "next/server";
import { getCurrentUser } from "../../../lib/session";

// Nunca pré-renderizar/cachear esta rota — depende da sessão da requisição.
export const dynamic = "force-dynamic";

// Usado pelo hook useUser() no client para saber papel (role), status de
// vendedor etc. — dados que não vêm do token de autenticação do Supabase.
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ user: null });
  return NextResponse.json({ user });
}
