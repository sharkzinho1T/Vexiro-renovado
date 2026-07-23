import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";
import { getCurrentUser } from "../../../../lib/session";

// Nunca pré-renderizar/cachear esta rota — ela consulta o banco de dados
// a cada requisição e não deve ser executada em tempo de build.
export const dynamic = "force-dynamic";

async function assertParticipant(conversationId, userId) {
  const conversation = await prisma.conversation.findUnique({ where: { id: conversationId } });
  if (!conversation) return null;
  if (conversation.buyerId !== userId && conversation.sellerId !== userId) return null;
  return conversation;
}

// GET /api/chat/[id] — mensagens da conversa (usado com polling no frontend)
export async function GET(_req, { params }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const conversation = await assertParticipant(params.id, user.id);
  if (!conversation) return NextResponse.json({ error: "Conversa não encontrada." }, { status: 404 });

  const messages = await prisma.message.findMany({
    where: { conversationId: params.id },
    include: { sender: { select: { name: true, avatarUrl: true } } },
    orderBy: { createdAt: "asc" },
  });

  await prisma.message.updateMany({
    where: { conversationId: params.id, senderId: { not: user.id }, read: false },
    data: { read: true },
  });

  return NextResponse.json({ messages });
}

// POST /api/chat/[id] — envia mensagem (texto e/ou anexo)
export async function POST(req, { params }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const conversation = await assertParticipant(params.id, user.id);
  if (!conversation) return NextResponse.json({ error: "Conversa não encontrada." }, { status: 404 });

  const { content, attachmentUrl } = await req.json();
  if (!content && !attachmentUrl) {
    return NextResponse.json({ error: "Mensagem vazia." }, { status: 400 });
  }

  const message = await prisma.message.create({
    data: { conversationId: params.id, senderId: user.id, content: content || "", attachmentUrl },
  });

  const recipientId = conversation.buyerId === user.id ? conversation.sellerId : conversation.buyerId;
  await prisma.notification.create({
    data: {
      userId: recipientId,
      type: "MESSAGE",
      title: "Nova mensagem",
      message: content ? content.slice(0, 80) : "Enviou um anexo.",
    },
  });

  return NextResponse.json({ message });
}
