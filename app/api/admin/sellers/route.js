import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";
import { requireAdmin } from "../../../../lib/admin";

// Nunca pré-renderizar/cachear esta rota — ela consulta o banco de dados
// a cada requisição e não deve ser executada em tempo de build.
export const dynamic = "force-dynamic";

export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;

  const sellers = await prisma.user.findMany({
    where: { sellerStatus: { in: ["PENDING", "VERIFIED", "REJECTED", "SUSPENDED"] } },
    select: { id: true, name: true, sellerName: true, email: true, sellerStatus: true, createdAt: true },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ sellers });
}
