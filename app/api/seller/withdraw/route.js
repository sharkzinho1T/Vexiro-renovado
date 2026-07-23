import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "../../../../lib/prisma";
import { getCurrentUser } from "../../../../lib/session";

// Nunca pré-renderizar/cachear esta rota — ela consulta o banco de dados
// a cada requisição e não deve ser executada em tempo de build.
export const dynamic = "force-dynamic";

const schema = z.object({
  amount: z.number().positive(),
  pixKey: z.string().min(5),
});

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  const withdrawals = await prisma.withdrawal.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ withdrawals });
}

// Solicita saque do saldo da carteira. O pagamento real ao vendedor (PIX de
// saída) precisa ser processado manualmente pelo admin ou via API de "Payouts"
// do seu provedor — a maioria dos gateways brasileiros exige aprovação manual
// da primeira transferência por motivos de compliance (PLD/KYC).
export async function POST(req) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  if (!["SELLER", "ADMIN"].includes(user.role)) {
    return NextResponse.json({ error: "Apenas vendedores podem solicitar saque." }, { status: 403 });
  }

  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });

  const wallet = await prisma.wallet.findUnique({ where: { userId: user.id } });
  if (!wallet || Number(wallet.balance) < parsed.data.amount) {
    return NextResponse.json({ error: "Saldo insuficiente." }, { status: 400 });
  }

  const withdrawal = await prisma.$transaction(async (tx) => {
    await tx.wallet.update({ where: { id: wallet.id }, data: { balance: { decrement: parsed.data.amount } } });
    await tx.walletTransaction.create({
      data: { walletId: wallet.id, amount: -parsed.data.amount, type: "withdrawal" },
    });
    await tx.notification.create({
      data: {
        userId: user.id,
        type: "WITHDRAWAL",
        title: "Saque solicitado",
        message: `Seu saque de R$ ${parsed.data.amount.toFixed(2)} foi solicitado e está em análise.`,
      },
    });
    return tx.withdrawal.create({
      data: { userId: user.id, amount: parsed.data.amount, pixKey: parsed.data.pixKey },
    });
  });

  return NextResponse.json({ withdrawal });
}
