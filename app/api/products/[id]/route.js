import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "../../../../lib/prisma";
import { getCurrentUser } from "../../../../lib/session";

// Nunca pré-renderizar/cachear esta rota — ela consulta o banco de dados
// a cada requisição e não deve ser executada em tempo de build.
export const dynamic = "force-dynamic";

export async function GET(_req, { params }) {
  const product = await prisma.product.findUnique({
    where: { id: params.id },
    include: {
      category: true,
      seller: { select: { id: true, name: true, sellerName: true, sellerStatus: true, avatarUrl: true } },
      reviews: { include: { user: { select: { name: true, avatarUrl: true } } }, orderBy: { createdAt: "desc" } },
    },
  });
  if (!product) return NextResponse.json({ error: "Produto não encontrado." }, { status: 404 });

  const avgRating = product.reviews.length
    ? product.reviews.reduce((s, r) => s + r.rating, 0) / product.reviews.length
    : 0;

  return NextResponse.json({ product: { ...product, avgRating } });
}

const updateSchema = z.object({
  title: z.string().min(3).max(120).optional(),
  description: z.string().min(10).optional(),
  price: z.number().positive().optional(),
  discount: z.number().min(0).max(90).optional(),
  stock: z.number().int().min(0).optional(),
  images: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
  active: z.boolean().optional(),
});

export async function PATCH(req, { params }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const product = await prisma.product.findUnique({ where: { id: params.id } });
  if (!product) return NextResponse.json({ error: "Produto não encontrado." }, { status: 404 });
  if (product.sellerId !== user.id && user.role !== "ADMIN") {
    return NextResponse.json({ error: "Sem permissão para editar este produto." }, { status: 403 });
  }

  const body = await req.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  const updated = await prisma.product.update({ where: { id: params.id }, data: parsed.data });
  return NextResponse.json({ product: updated });
}

export async function DELETE(_req, { params }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });

  const product = await prisma.product.findUnique({ where: { id: params.id } });
  if (!product) return NextResponse.json({ error: "Produto não encontrado." }, { status: 404 });
  if (product.sellerId !== user.id && user.role !== "ADMIN") {
    return NextResponse.json({ error: "Sem permissão para remover este produto." }, { status: 403 });
  }

  await prisma.product.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
