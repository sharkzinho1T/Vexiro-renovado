import { NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";
import { getCurrentUser } from "../../../lib/session";

// Nunca pré-renderizar/cachear esta rota — ela consulta o banco de dados
// a cada requisição e não deve ser executada em tempo de build.
export const dynamic = "force-dynamic";

// GET /api/chat — lista as conversas do usuário logado
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const conversations = await prisma.conversation.findMany({
    where: { OR: [{ buyerId: user.id }, { sellerId: user.id }] },
    include: {
      buyer: { select: { id: true, name: true, avatarUrl: true } },
      seller: { select: { id: true, name: true, avatarUrl: true } },
      product: { select: { id: true, title: true, images: true } },
      messages: { orderBy: { createdAt: "desc" }, take: 1 },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ conversations });
}

// POST /api/chat — inicia (ou reaproveita) uma conversa com um vendedor
export async function POST(req) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const { sellerId, productId } = await req.json();
  if (!sellerId) return NextResponse.json({ error: "sellerId obrigatório." }, { status: 400 });
  if (sellerId === user.id) return NextResponse.json({ error: "Você não pode conversar consigo mesmo." }, { status: 400 });

  const conversation = await prisma.conversation.upsert({
    where: { buyerId_sellerId_productId: { buyerId: user.id, sellerId, productId: productId || null } },
    update: {},
    create: { buyerId: user.id, sellerId, productId: productId || null },
  });

  return NextResponse.json({ conversation });
}
