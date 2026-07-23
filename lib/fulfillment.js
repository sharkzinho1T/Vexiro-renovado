import { prisma } from "./prisma";

const PLATFORM_FEE_PERCENT = 8; // taxa da plataforma sobre cada venda

// Confirma o pagamento de um pedido: credita vendedor(es), pontos do
// comprador, baixa estoque e "entrega" o item digital. Idempotente —
// pode ser chamado várias vezes (pelo webhook e por polling) sem duplicar efeitos.
export async function fulfillOrder(orderId) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: { include: { product: true } }, payments: true },
  });
  if (!order) throw new Error("Pedido não encontrado");
  if (order.status === "PAID" || order.status === "DELIVERED") {
    return order; // já processado — evita processar duas vezes
  }

  await prisma.$transaction(async (tx) => {
    await tx.payment.updateMany({
      where: { orderId: order.id, status: "PENDING" },
      data: { status: "APPROVED" },
    });

    for (const item of order.items) {
      await tx.product.update({
        where: { id: item.productId },
        data: { stock: { decrement: item.quantity }, sold: { increment: item.quantity } },
      });

      // Entrega digital: em produção, aqui entraria a lógica de puxar a
      // credencial/código real cadastrado pelo vendedor para este produto.
      // Como placeholder seguro, geramos um código de entrega único por item.
      const deliveredPayload = `VEXIRO-DELIVERY-${item.id.slice(-10).toUpperCase()}`;
      await tx.orderItem.update({ where: { id: item.id }, data: { deliveredPayload } });

      const product = item.product;
      const netAmount = Number(item.unitPrice) * item.quantity * (1 - PLATFORM_FEE_PERCENT / 100);

      const sellerWallet = await tx.wallet.upsert({
        where: { userId: product.sellerId },
        update: {},
        create: { userId: product.sellerId, balance: 0 },
      });
      await tx.wallet.update({ where: { id: sellerWallet.id }, data: { balance: { increment: netAmount } } });
      await tx.walletTransaction.create({
        data: { walletId: sellerWallet.id, amount: netAmount, type: "sale", reference: order.id },
      });

      await tx.notification.create({
        data: {
          userId: product.sellerId,
          type: "SALE",
          title: "Nova venda realizada!",
          message: `Você vendeu "${product.title}" por ${item.quantity}x. Valor creditado na sua carteira.`,
        },
      });
    }

    const points = Math.floor(Number(order.total));
    await tx.user.update({ where: { id: order.buyerId }, data: { vortexPoints: { increment: points } } });

    if (order.couponId) {
      await tx.coupon.update({ where: { id: order.couponId }, data: { usedCount: { increment: 1 } } });
    }

    await tx.order.update({ where: { id: order.id }, data: { status: "DELIVERED" } });

    await tx.notification.create({
      data: {
        userId: order.buyerId,
        type: "PURCHASE",
        title: "Pagamento confirmado!",
        message: `Seu pedido #${order.id.slice(-8)} foi pago e os itens já estão disponíveis no seu histórico.`,
      },
    });
  });

  return prisma.order.findUnique({ where: { id: orderId }, include: { items: true, payments: true } });
}
