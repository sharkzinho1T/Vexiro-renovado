import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";
import { getCurrentUser } from "../../../../lib/session";

// Nunca pré-renderizar/cachear esta rota — ela consulta o banco de dados
// a cada requisição e não deve ser executada em tempo de build.
export const dynamic = "force-dynamic";

// Usuário solicita virar vendedor (fica pendente até aprovação do admin)
export async function POST(req) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const { sellerName } = await req.json();

  await prisma.user.update({
    where: { id: user.id },
    data: { role: "SELLER", sellerStatus: "PENDING", sellerName: sellerName || user.name },
  });

  await prisma.wallet.upsert({ where: { userId: user.id }, update: {}, create: { userId: user.id, balance: 0 } });

  return NextResponse.json({ ok: true });
}
