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

const CATEGORIES = [
  { slug: "freefire", name: "Free Fire", icon: "flame" },
  { slug: "roblox", name: "Roblox", icon: "box" },
  { slug: "minecraft", name: "Minecraft", icon: "pickaxe" },
  { slug: "fortnite", name: "Fortnite", icon: "swords" },
  { slug: "valorant", name: "Valorant", icon: "crosshair" },
  { slug: "outros", name: "Outros Jogos", icon: "sparkles" },
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
    await prisma.category.upsert({ where: { slug: c.slug }, update: {}, create: c });
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
