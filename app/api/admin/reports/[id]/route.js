import { NextResponse } from "next/server";
import { prisma } from "../../../../../lib/prisma";
import { requireAdmin } from "../../../../../lib/admin";
import { logAudit } from "../../../../../lib/audit";

// Nunca pré-renderizar/cachear esta rota — ela consulta o banco de dados
// a cada requisição e não deve ser executada em tempo de build.
export const dynamic = "force-dynamic";

export async function PATCH(req, { params }) {
  const { error, user: admin } = await requireAdmin();
  if (error) return error;

  const { status } = await req.json();
  if (!["IN_REVIEW", "RESOLVED", "DISMISSED"].includes(status)) {
    return NextResponse.json({ error: "Status inválido." }, { status: 400 });
  }

  const report = await prisma.report.update({ where: { id: params.id }, data: { status } });
  await logAudit(admin.id, "admin.report.status", { reportId: params.id, status });

  return NextResponse.json({ report });
}
