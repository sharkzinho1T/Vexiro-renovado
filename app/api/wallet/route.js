import { NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";
import { getCurrentUser } from "../../../lib/session";

// Nunca pré-renderizar/cachear esta rota — ela consulta o banco de dados
// a cada requisição e não deve ser executada em tempo de build.
export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const wallet = await prisma.wallet.upsert({
    where: { userId: user.id },
    update: {},
    create: { userId: user.id, balance: 0 },
    include: { transactions: { orderBy: { createdAt: "desc" }, take: 30 } },
  });

  const fullUser = await prisma.user.findUnique({ where: { id: user.id }, select: { vortexPoints: true } });

  return NextResponse.json({ wallet, vortexPoints: fullUser.vortexPoints });
}
