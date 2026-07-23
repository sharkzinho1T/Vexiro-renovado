import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "../../../lib/prisma";
import { getCurrentUser } from "../../../lib/session";
import { createPixPayment } from "../../../lib/mercadopago";
import { logAudit } from "../../../lib/audit";

// Nunca pré-renderizar/cachear esta rota — ela consulta o banco de dados
// a cada requisição e não deve ser executada em tempo de build.
export const dynamic = "force-dynamic";

const schema = z.object({
  items: z.array(z.object({ productId: z.string(), quantity: z.number().int().min(1) })).min(1),
  couponCode: z.string().optional(),
});

// GET /api/orders — histórico de compras do usuário logado
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const orders = await prisma.order.findMany({
    where: { buyerId: user.id },
    include: { items: true, payments: true },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ orders });
}

// POST /api/orders — cria o pedido a partir do carrinho e gera a cobrança PIX
export async function POST(req) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });

  const { items, couponCode } = parsed.data;

  const products = await prisma.product.findMany({
    where: { id: { in: items.map((i) => i.productId) }, active: true },
  });

  if (products.length !== items.length) {
    return NextResponse.json({ error: "Um ou mais produtos não estão mais disponíveis." }, { status: 400 });
  }

  for (const item of items) {
    const product = products.find((p) => p.id === item.productId);
    if (product.stock < item.quantity) {
      return NextResponse.json({ error: `Estoque insuficiente para "${product.title}".` }, { status: 400 });
    }
  }

  let subtotal = 0;
  const orderItemsData = items.map((item) => {
    const product = products.find((p) => p.id === item.productId);
    const unitPrice = Number(product.price) * (1 - product.discount / 100);
    subtotal += unitPrice * item.quantity;
    return {
      productId: product.id,
      title: product.title,
      unitPrice,
      quantity: item.quantity,
    };
  });

  let discountTotal = 0;
  let coupon = null;
  if (couponCode) {
    coupon = await prisma.coupon.findUnique({ where: { code: couponCode.toUpperCase() } });
    const validCoupon =
      coupon &&
      coupon.active &&
      (!coupon.expiresAt || coupon.expiresAt > new Date()) &&
      (!coupon.maxUses || coupon.usedCount < coupon.maxUses);
    if (!validCoupon) {
      return NextResponse.json({ error: "Cupom inválido ou expirado." }, { status: 400 });
    }
    discountTotal = subtotal * (coupon.percentOff / 100);
  }

  const total = Math.max(0, subtotal - discountTotal);

  const order = await prisma.order.create({
    data: {
      buyerId: user.id,
      subtotal,
      discountTotal,
      total,
      couponId: coupon?.id,
      items: { create: orderItemsData },
    },
    include: { items: true },
  });

  let pix;
  try {
    pix = await createPixPayment({
      amount: total,
      description: `Pedido Vexiro #${order.id.slice(-8)}`,
      payerEmail: user.email,
      externalReference: order.id,
    });
  } catch (e) {
    return NextResponse.json({ error: "Falha ao gerar cobrança PIX. Tente novamente." }, { status: 502 });
  }

  const payment = await prisma.payment.create({
    data: {
      orderId: order.id,
      method: "PIX",
      status: "PENDING",
      amount: total,
      providerId: pix.simulated ? null : pix.providerId,
      pixQrCode: pix.simulated ? null : pix.qrCodeBase64,
      pixCopyPaste: pix.simulated
        ? `00020126SIMULADO-VEXIRO-${order.id}5204000053039865406${total.toFixed(2)}5802BR5909VEXIRO6304FFFF`
        : pix.copyPaste,
    },
  });

  await logAudit(user.id, "order.created", { orderId: order.id, total });

  return NextResponse.json({
    order,
    payment,
    simulated: pix.simulated || false,
  });
}
