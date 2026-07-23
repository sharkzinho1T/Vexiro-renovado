import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";
import { getPaymentStatus } from "../../../../lib/mercadopago";
import { fulfillOrder } from "../../../../lib/fulfillment";

// Nunca pré-renderizar/cachear esta rota — ela consulta o banco de dados
// a cada requisição e não deve ser executada em tempo de build.
export const dynamic = "force-dynamic";

// Endpoint público chamado pelo Mercado Pago quando o status de um pagamento
// muda. Configure esta URL (https://SEUDOMINIO/api/webhooks/mercadopago) no
// painel do Mercado Pago > Notificações Webhooks.
export async function POST(req) {
  const body = await req.json().catch(() => null);
  const paymentId = body?.data?.id;
  if (!paymentId) return NextResponse.json({ ok: true }); // ignora eventos irrelevantes

  const status = await getPaymentStatus(paymentId);
  if (status.status !== "approved") return NextResponse.json({ ok: true });

  const payment = await prisma.payment.findFirst({ where: { providerId: String(paymentId) } });
  if (!payment) return NextResponse.json({ ok: true });

  await fulfillOrder(payment.orderId);
  return NextResponse.json({ ok: true });
}
