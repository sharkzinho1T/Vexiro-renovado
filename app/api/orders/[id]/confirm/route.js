import { NextResponse } from "next/server";
import { prisma } from "../../../../../lib/prisma";
import { getCurrentUser } from "../../../../../lib/session";
import { getPaymentStatus } from "../../../../../lib/mercadopago";
import { fulfillOrder } from "../../../../../lib/fulfillment";

// Nunca pré-renderizar/cachear esta rota — ela consulta o banco de dados
// a cada requisição e não deve ser executada em tempo de build.
export const dynamic = "force-dynamic";

// Chamado pelo botão "Já paguei" no checkout — confirma junto ao Mercado
// Pago (se configurado) ou, em modo de demonstração (sem chave configurada),
// aprova automaticamente para permitir testar o fluxo completo.
export async function POST(_req, { params }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const order = await prisma.order.findUnique({
    where: { id: params.id },
    include: { payments: true },
  });
  if (!order || order.buyerId !== user.id) {
    return NextResponse.json({ error: "Pedido não encontrado." }, { status: 404 });
  }

  const payment = order.payments[0];
  if (!payment) return NextResponse.json({ error: "Pagamento não encontrado." }, { status: 404 });

  if (payment.providerId) {
    const status = await getPaymentStatus(payment.providerId);
    if (status.status !== "approved") {
      return NextResponse.json({ status: status.status, message: "Pagamento ainda não confirmado pelo Mercado Pago." });
    }
  }
  // modo simulado (sem MERCADOPAGO_ACCESS_TOKEN configurado): aprova direto

  const updatedOrder = await fulfillOrder(order.id);
  return NextResponse.json({ order: updatedOrder });
}
