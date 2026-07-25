// Seed do Vexiro — cria categorias, conta admin, vendedor de demonstração e
// produtos de exemplo. Usuários são criados via Supabase Admin API (service
// role key), nunca com senha manual no banco: o trigger handle_new_user()
// (veja supabase/auth-trigger.sql) cria a linha correspondente em public."User"
// automaticamente quando o usuário é criado no Auth.
const { PrismaClient } = require("@prisma/client");
const { createClient } = require("@supabase/supabase-js");

const prisma = new PrismaClient();

if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error(
    "Defina NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY no .env antes de rodar o seed."
  );
  process.exit(1);
}

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

// As 8 primeiras aparecem na home (featured: true), com banner de imagem.
// As demais só aparecem via busca ou na página /categorias — mantém o
// catálogo completo sem poluir a tela inicial.
const CATEGORIES = [
  { slug: "freefire", name: "Free Fire", icon: "flame", featured: true, imageUrl: "https://i.postimg.cc/ZqXJnBzt/05e55d6dd73173f755ab5fde46e98b16.jpg" },
  { slug: "minecraft", name: "Minecraft", icon: "pickaxe", featured: true, imageUrl: "https://i.postimg.cc/BnQSVfBr/33eef535b2ffa74da6a14c01834f2932.jpg" },
  { slug: "league-of-legends", name: "League of Legends", icon: "swords", featured: true, imageUrl: "https://i.postimg.cc/tRW415g8/d1b11d5e4dbae547ac0d651476cec488.jpg" },
  { slug: "fortnite", name: "Fortnite", icon: "swords", featured: true, imageUrl: "https://i.postimg.cc/KzgvD7DG/1342e6ef97e46edf4b2d4e715396de00.jpg" },
  { slug: "cs2", name: "CS2", icon: "crosshair", featured: true, imageUrl: "https://i.postimg.cc/Z5VRb5qk/3c1e871625f3c31c9b7d10ed179205e9.jpg" },
  { slug: "genshin-impact", name: "Genshin Impact", icon: "sparkles", featured: true, imageUrl: "https://i.postimg.cc/bvmzhC3d/aa382fc2160ece3fe40c8d8d0b9d2368.jpg" },
  { slug: "roblox", name: "Roblox", icon: "box", featured: true, imageUrl: "https://i.postimg.cc/6pN6LG8W/d847c63326ad4ed39f95384118d0c8f9.jpg" },
  { slug: "valorant", name: "Valorant", icon: "crosshair", featured: true, imageUrl: "https://i.postimg.cc/Yq0QKZRd/a400333f7c9137ad1ebb9ded69755c48.jpg" },

  // Não aparecem na home — encontráveis pela busca / página de categorias.
  { slug: "gta-v", name: "GTA V", icon: "car", featured: false },
  { slug: "call-of-duty-mobile", name: "Call of Duty Mobile", icon: "crosshair", featured: false },
  { slug: "pubg-mobile", name: "PUBG Mobile", icon: "crosshair", featured: false },
  { slug: "clash-royale", name: "Clash Royale", icon: "swords", featured: false },
  { slug: "clash-of-clans", name: "Clash of Clans", icon: "swords", featured: false },
  { slug: "brawl-stars", name: "Brawl Stars", icon: "sparkles", featured: false },
  { slug: "mobile-legends", name: "Mobile Legends", icon: "swords", featured: false },
  { slug: "stumble-guys", name: "Stumble Guys", icon: "sparkles", featured: false },
  { slug: "honkai-star-rail", name: "Honkai: Star Rail", icon: "sparkles", featured: false },
  { slug: "growtopia", name: "Growtopia", icon: "box", featured: false },
  { slug: "steam", name: "Contas e cartões Steam", icon: "gamepad", featured: false },
  { slug: "discord-nitro", name: "Discord Nitro", icon: "sparkles", featured: false },
  { slug: "outros", name: "Outros Jogos", icon: "sparkles", featured: false },
];

// Cria (ou reaproveita, se já existir) um usuário no Supabase Auth e espera
// o trigger do banco criar o perfil correspondente em public."User".
async function ensureAuthUser({ email, password, name }) {
  const { data: created, error } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { name },
  });

  if (error) {
    if (error.message.includes("already been registered") || error.status === 422) {
      const { data: list } = await supabaseAdmin.auth.admin.listUsers();
      const existing = list.users.find((u) => u.email === email);
      if (existing) return existing.id;
    }
    throw error;
  }
  return created.user.id;
}

async function waitForProfile(id, attempts = 10) {
  for (let i = 0; i < attempts; i++) {
    const profile = await prisma.user.findUnique({ where: { id } });
    if (profile) return profile;
    await new Promise((r) => setTimeout(r, 300));
  }
  throw new Error(
    "Perfil não foi criado a tempo pelo trigger do banco. Confirme se supabase/auth-trigger.sql foi executado no SQL Editor do Supabase."
  );
}

async function main() {
  console.log("Criando categorias...");
  for (const c of CATEGORIES) {
    await prisma.category.upsert({ where: { slug: c.slug }, update: c, create: c });
  }

  console.log("Criando conta administradora...");
  const adminId = await ensureAuthUser({
    email: "admin@vexiro.com",
    password: process.env.SEED_ADMIN_PASSWORD || "TrocarSenha123!",
    name: "Administrador Vexiro",
  });
  await waitForProfile(adminId);
  await prisma.user.update({ where: { id: adminId }, data: { role: "ADMIN" } });

  console.log("Criando vendedor de demonstração...");
  const sellerId = await ensureAuthUser({
    email: "vendedor@vexiro.com",
    password: "Vendedor123!",
    name: "Loja Demo",
  });
  await waitForProfile(sellerId);
  await prisma.user.update({
    where: { id: sellerId },
    data: { role: "SELLER", sellerStatus: "VERIFIED", sellerName: "VexiroOficial" },
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
        sellerId,
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
        sellerId,
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
        sellerId,
        warrantyDays: 30,
      },
    ],
    skipDuplicates: true,
  });

  console.log("\nSeed concluído.");
  console.log(`Login admin: admin@vexiro.com / ${process.env.SEED_ADMIN_PASSWORD || "TrocarSenha123!"}`);
  console.log("Login vendedor demo: vendedor@vexiro.com / Vendedor123!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
