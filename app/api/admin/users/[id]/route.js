import { NextResponse } from "next/server";
import { prisma } from "../../../../../lib/prisma";
import { requireAdmin } from "../../../../../lib/admin";
import { logAudit } from "../../../../../lib/audit";

// Nunca pré-renderizar/cachear esta rota — ela consulta o banco de dados
// a cada requisição e não deve ser executada em tempo de build.
export const dynamic = "force-dynamic";

// PATCH — suspender/reativar usuário, ou alterar cargo
export async function PATCH(req, { params }) {
  const { error, user: admin } = await requireAdmin();
  if (error) return error;

  const { suspended, role } = await req.json();
  const data = {};
  if (typeof suspended === "boolean") data.suspended = suspended;
  if (role && ["BUYER", "SELLER", "ADMIN"].includes(role)) data.role = role;

  const updated = await prisma.user.update({ where: { id: params.id }, data });
  await logAudit(admin.id, "admin.user.update", { targetUserId: params.id, data });

  return NextResponse.json({ user: updated });
}
