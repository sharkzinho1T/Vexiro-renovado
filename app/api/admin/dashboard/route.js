import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";
import { requireAdmin } from "../../../../lib/admin";

// Nunca pré-renderizar/cachear esta rota — ela consulta o banco de dados
// a cada requisição e não deve ser executada em tempo de build.
export const dynamic = "force-dynamic";

export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;

  const [userCount, sellerCount, productCount, orders, openReports] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { role: "SELLER" } }),
    prisma.product.count({ where: { active: true } }),
    prisma.order.findMany({ where: { status: { in: ["PAID", "DELIVERED"] } }, select: { total: true } }),
    prisma.report.count({ where: { status: "OPEN" } }),
  ]);

  const totalVolume = orders.reduce((s, o) => s + Number(o.total), 0);

  return NextResponse.json({
    userCount, sellerCount, productCount, openReports,
    totalVolume, orderCount: orders.length,
  });
}
