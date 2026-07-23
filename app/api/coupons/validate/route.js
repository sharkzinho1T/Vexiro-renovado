import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";

// Nunca pré-renderizar/cachear esta rota — ela consulta o banco de dados
// a cada requisição e não deve ser executada em tempo de build.
export const dynamic = "force-dynamic";

export async function POST(req) {
  const { code } = await req.json();
  if (!code) return NextResponse.json({ valid: false });

  const coupon = await prisma.coupon.findUnique({ where: { code: code.toUpperCase() } });
  const valid =
    coupon &&
    coupon.active &&
    (!coupon.expiresAt || coupon.expiresAt > new Date()) &&
    (!coupon.maxUses || coupon.usedCount < coupon.maxUses);

  if (!valid) return NextResponse.json({ valid: false });
  return NextResponse.json({ valid: true, percentOff: coupon.percentOff });
}
