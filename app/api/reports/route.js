import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "../../../lib/prisma";
import { getCurrentUser } from "../../../lib/session";

// Nunca pré-renderizar/cachear esta rota — ela consulta o banco de dados
// a cada requisição e não deve ser executada em tempo de build.
export const dynamic = "force-dynamic";

const schema = z.object({
  targetType: z.enum(["product", "user", "message"]),
  targetId: z.string(),
  reason: z.string().min(5).max(300),
});

export async function POST(req) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });

  const report = await prisma.report.create({ data: { ...parsed.data, reporterId: user.id } });
  return NextResponse.json({ report }, { status: 201 });
}
