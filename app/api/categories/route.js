import { NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";

// Nunca pré-renderizar/cachear esta rota — ela consulta o banco de dados
// a cada requisição e não deve ser executada em tempo de build.
export const dynamic = "force-dynamic";

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const featured = searchParams.get("featured");
  const categories = await prisma.category.findMany({
    where: featured === "true" ? { featured: true } : undefined,
    orderBy: { name: "asc" },
  });
  return NextResponse.json({ categories });
}
