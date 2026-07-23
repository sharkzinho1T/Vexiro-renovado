import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";
import { getCurrentUser } from "../../../../lib/session";

// Nunca pré-renderizar/cachear esta rota — ela consulta o banco de dados
// a cada requisição e não deve ser executada em tempo de build.
export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const products = await prisma.product.findMany({
    where: { sellerId: user.id },
    include: { category: true },
    orderBy: { createdAt: "desc" },
  });

  const earnings = await prisma.walletTransaction.aggregate({
    where: { wallet: { userId: user.id }, type: "sale" },
    _sum: { amount: true },
  });

  return NextResponse.json({ products, earnings: earnings._sum.amount || 0 });
}
