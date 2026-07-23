import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "../../../lib/prisma";
import { getCurrentUser } from "../../../lib/session";

// Nunca pré-renderizar/cachear esta rota — ela consulta o banco de dados
// a cada requisição e não deve ser executada em tempo de build.
export const dynamic = "force-dynamic";

const schema = z.object({
  productId: z.string(),
  rating: z.number().int().min(1).max(5),
  comment: z.string().min(3).max(500),
});

export async function POST(req) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });

  // só pode avaliar quem já comprou o produto
  const boughtItem = await prisma.orderItem.findFirst({
    where: { productId: parsed.data.productId, order: { buyerId: user.id, status: { in: ["PAID", "DELIVERED"] } } },
  });
  if (!boughtItem) {
    return NextResponse.json({ error: "Você só pode avaliar produtos que já comprou." }, { status: 403 });
  }

  const review = await prisma.review.upsert({
    where: { userId_productId: { userId: user.id, productId: parsed.data.productId } },
    update: { rating: parsed.data.rating, comment: parsed.data.comment },
    create: { ...parsed.data, userId: user.id },
  });

  return NextResponse.json({ review });
}
