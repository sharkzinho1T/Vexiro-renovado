const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

const CATEGORIES = [
  { slug: "freefire", name: "Free Fire", icon: "flame" },
  { slug: "roblox", name: "Roblox", icon: "box" },
  { slug: "minecraft", name: "Minecraft", icon: "pickaxe" },
  { slug: "fortnite", name: "Fortnite", icon: "swords" },
  { slug: "valorant", name: "Valorant", icon: "crosshair" },
  { slug: "outros", name: "Outros Jogos", icon: "sparkles" },
];

async function main() {
  console.log("Criando categorias...");
  for (const c of CATEGORIES) {
    await prisma.category.upsert({ where: { slug: c.slug }, update: {}, create: c });
  }

  console.log("Criando conta administradora...");
  const adminPassword = await bcrypt.hash(process.env.SEED_ADMIN_PASSWORD || "TrocarSenha123!", 12);
  const admin = await prisma.user.upsert({
    where: { email: "admin@vexiro.com" },
    update: {},
    create: {
      name: "Administrador Vexiro",
      email: "admin@vexiro.com",
      passwordHash: adminPassword,
      role: "ADMIN",
      wallet: { create: { balance: 0 } },
    },
  });

  console.log("Criando vendedor de demonstração...");
  const sellerPassword = await bcrypt.hash("Vendedor123!", 12);
  const seller = await prisma.user.upsert({
    where: { email: "vendedor@vexiro.com" },
    update: {},
    create: {
      name: "Loja Demo",
      email: "vendedor@vexiro.com",
      passwordHash: sellerPassword,
      role: "SELLER",
      sellerStatus: "VERIFIED",
      sellerName: "VexiroOficial",
      wallet: { create: { balance: 0 } },
    },
  });

  const freefire = await prisma.category.findUnique({ where: { slug: "freefire" } });
  const roblox = await prisma.category.findUnique({ where: { slug: "roblox" } });
  const valorant = await prisma.category.findUnique({ where: { slug: "valorant" } });

  console.log("Criando produtos de demonstração...");
  await prisma.product.createMany({
    data: [
      {
        title: "Diamantes Free Fire — 5.600",
        description: "Recarga de diamantes via login direto na conta, entrega em minutos após confirmação do pagamento.",
        price: 89.9,
        stock: 50,
        images: [],
        tags: ["freefire", "diamantes"],
        categoryId: freefire.id,
        sellerId: seller.id,
        warrantyDays: 7,
      },
      {
        title: "2.000 Robux — Entrega Instantânea",
        description: "Robux entregues via gamepass após a compra. Processo automatizado.",
        price: 59.9,
        stock: 100,
        images: [],
        tags: ["roblox", "robux"],
        categoryId: roblox.id,
        sellerId: seller.id,
        warrantyDays: 7,
      },
      {
        title: "Conta Valorant Radiant — Skins Premium",
        description: "Conta na elite Radiant, com coleções Prime, Reaver e Elderflame completas.",
        price: 349.9,
        stock: 1,
        images: [],
        tags: ["valorant", "conta"],
        categoryId: valorant.id,
        sellerId: seller.id,
        warrantyDays: 30,
      },
    ],
    skipDuplicates: true,
  });

  console.log("Seed concluído.");
  console.log(`Login admin: admin@vexiro.com / senha definida em SEED_ADMIN_PASSWORD (ou "TrocarSenha123!" por padrão)`);
  console.log("Login vendedor demo: vendedor@vexiro.com / Vendedor123!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
