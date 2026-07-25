-- Categorias em destaque na home, com banner de imagem.

ALTER TABLE "Category" ADD COLUMN IF NOT EXISTS "imageUrl" TEXT;
ALTER TABLE "Category" ADD COLUMN IF NOT EXISTS "featured" BOOLEAN NOT NULL DEFAULT false;

-- Cria (ou atualiza, se o slug já existir) cada categoria. Isso roda
-- automaticamente no próximo deploy (prisma migrate deploy), sem precisar
-- rodar o seed manualmente.

INSERT INTO "Category" (id, slug, name, icon, "imageUrl", featured)
VALUES
  (gen_random_uuid()::text, 'freefire', 'Free Fire', 'flame', 'https://i.postimg.cc/ZqXJnBzt/05e55d6dd73173f755ab5fde46e98b16.jpg', true),
  (gen_random_uuid()::text, 'minecraft', 'Minecraft', 'pickaxe', 'https://i.postimg.cc/BnQSVfBr/33eef535b2ffa74da6a14c01834f2932.jpg', true),
  (gen_random_uuid()::text, 'league-of-legends', 'League of Legends', 'swords', 'https://i.postimg.cc/tRW415g8/d1b11d5e4dbae547ac0d651476cec488.jpg', true),
  (gen_random_uuid()::text, 'fortnite', 'Fortnite', 'swords', 'https://i.postimg.cc/KzgvD7DG/1342e6ef97e46edf4b2d4e715396de00.jpg', true),
  (gen_random_uuid()::text, 'cs2', 'CS2', 'crosshair', 'https://i.postimg.cc/Z5VRb5qk/3c1e871625f3c31c9b7d10ed179205e9.jpg', true),
  (gen_random_uuid()::text, 'genshin-impact', 'Genshin Impact', 'sparkles', 'https://i.postimg.cc/bvmzhC3d/aa382fc2160ece3fe40c8d8d0b9d2368.jpg', true),
  (gen_random_uuid()::text, 'roblox', 'Roblox', 'box', 'https://i.postimg.cc/6pN6LG8W/d847c63326ad4ed39f95384118d0c8f9.jpg', true),
  (gen_random_uuid()::text, 'valorant', 'Valorant', 'crosshair', 'https://i.postimg.cc/Yq0QKZRd/a400333f7c9137ad1ebb9ded69755c48.jpg', true),
  (gen_random_uuid()::text, 'gta-v', 'GTA V', 'car', NULL, false),
  (gen_random_uuid()::text, 'call-of-duty-mobile', 'Call of Duty Mobile', 'crosshair', NULL, false),
  (gen_random_uuid()::text, 'pubg-mobile', 'PUBG Mobile', 'crosshair', NULL, false),
  (gen_random_uuid()::text, 'clash-royale', 'Clash Royale', 'swords', NULL, false),
  (gen_random_uuid()::text, 'clash-of-clans', 'Clash of Clans', 'swords', NULL, false),
  (gen_random_uuid()::text, 'brawl-stars', 'Brawl Stars', 'sparkles', NULL, false),
  (gen_random_uuid()::text, 'mobile-legends', 'Mobile Legends', 'swords', NULL, false),
  (gen_random_uuid()::text, 'stumble-guys', 'Stumble Guys', 'sparkles', NULL, false),
  (gen_random_uuid()::text, 'honkai-star-rail', 'Honkai: Star Rail', 'sparkles', NULL, false),
  (gen_random_uuid()::text, 'growtopia', 'Growtopia', 'box', NULL, false),
  (gen_random_uuid()::text, 'steam', 'Contas e cartões Steam', 'gamepad', NULL, false),
  (gen_random_uuid()::text, 'discord-nitro', 'Discord Nitro', 'sparkles', NULL, false),
  (gen_random_uuid()::text, 'outros', 'Outros Jogos', 'sparkles', NULL, false)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  icon = EXCLUDED.icon,
  "imageUrl" = EXCLUDED."imageUrl",
  featured = EXCLUDED.featured;
