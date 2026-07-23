import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "../../../lib/prisma";
import { getCurrentUser } from "../../../lib/session";

// Nunca pré-renderizar/cachear esta rota — ela consulta o banco de dados
// a cada requisição e não deve ser executada em tempo de build.
export const dynamic = "force-dynamic";

// GET /api/products?category=roblox&q=robux&page=1
export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category");
  const q = searchParams.get("q");
  const sellerId = searchParams.get("sellerId");
  const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
  const pageSize = 24;

  const where = {
    active: true,
    ...(category && category !== "all" ? { category: { slug: category } } : {}),
    ...(sellerId ? { sellerId } : {}),
    ...(q
      ? {
          OR: [
            { title: { contains: q, mode: "insensitive" } },
            { tags: { has: q.toLowerCase() } },
          ],
        }
      : {}),
  };

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      include: {
        category: true,
        seller: { select: { id: true, name: true, sellerName: true, sellerStatus: true } },
        reviews: { select: { rating: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.product.count({ where }),
  ]);

  const shaped = products.map((p) => ({
    ...p,
    avgRating: p.reviews.length ? p.reviews.reduce((s, r) => s + r.rating, 0) / p.reviews.length : 0,
    reviewCount: p.reviews.length,
  }));

  return NextResponse.json({ products: shaped, total, page, pageSize });
}

const createSchema = z.object({
  title: z.string().min(3).max(120),
  description: z.string().min(10),
  price: z.number().positive(),
  discount: z.number().min(0).max(90).default(0),
  stock: z.number().int().min(0),
  images: z.array(z.string()).default([]),
  tags: z.array(z.string()).default([]),
  categorySlug: z.string(),
  sku: z.string().optional(),
  warrantyDays: z.number().int().min(0).default(0),
});

// POST /api/products — cria produto (apenas vendedores)
export async function POST(req) {
  const user = await getCurrentUser();
  if (!user || !["SELLER", "ADMIN"].includes(user.role)) {
    return NextResponse.json({ error: "Apenas vendedores podem anunciar produtos." }, { status: 403 });
  }

  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  const category = await prisma.category.findUnique({ where: { slug: parsed.data.categorySlug } });
  if (!category) {
    return NextResponse.json({ error: "Categoria inválida." }, { status: 400 });
  }

  const { categorySlug, ...data } = parsed.data;

  const product = await prisma.product.create({
    data: { ...data, categoryId: category.id, sellerId: user.id },
  });

  return NextResponse.json({ product }, { status: 201 });
}
