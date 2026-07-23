import { NextResponse } from "next/server";
import { prisma } from "../../../../../lib/prisma";
import { requireAdmin } from "../../../../../lib/admin";
import { logAudit } from "../../../../../lib/audit";

// Nunca pré-renderizar/cachear esta rota — ela consulta o banco de dados
// a cada requisição e não deve ser executada em tempo de build.
export const dynamic = "force-dynamic";

// PATCH — aprova ("VERIFIED", concede o selo), rejeita ou suspende um vendedor
export async function PATCH(req, { params }) {
  const { error, user: admin } = await requireAdmin();
  if (error) return error;

  const { status } = await req.json();
  if (!["VERIFIED", "REJECTED", "SUSPENDED"].includes(status)) {
    return NextResponse.json({ error: "Status inválido." }, { status: 400 });
  }

  const seller = await prisma.user.update({ where: { id: params.id }, data: { sellerStatus: status } });

  await prisma.notification.create({
    data: {
      userId: params.id,
      type: "SYSTEM",
      title: status === "VERIFIED" ? "Você agora é um Vendedor Verificado!" : "Atualização da sua conta de vendedor",
      message:
        status === "VERIFIED"
          ? "Parabéns! Sua loja recebeu o selo de Vendedor Verificado e ganha mais destaque no catálogo."
          : `O status da sua conta de vendedor foi atualizado para: ${status}.`,
    },
  });

  await logAudit(admin.id, "admin.seller.status", { targetUserId: params.id, status });

  return NextResponse.json({ seller });
}
