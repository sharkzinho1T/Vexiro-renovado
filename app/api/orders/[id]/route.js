import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";
import { getCurrentUser } from "../../../../lib/session";

// Nunca pré-renderizar/cachear esta rota — ela consulta o banco de dados
// a cada requisição e não deve ser executada em tempo de build.
export const dynamic = "force-dynamic";

export async function GET(_req, { params }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const order = await prisma.order.findUnique({
    where: { id: params.id },
    include: { items: true, payments: true },
  });
  if (!order || order.buyerId !== user.id) {
    return NextResponse.json({ error: "Pedido não encontrado." }, { status: 404 });
  }
  return NextResponse.json({ order });
}
