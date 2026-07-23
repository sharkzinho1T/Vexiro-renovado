-- Vexiro — script complementar ao Prisma para o Supabase.
--
-- O Prisma (via `npx prisma migrate dev`) já cria todas as tabelas, chaves
-- estrangeiras, índices e constraints a partir de prisma/schema.prisma.
-- Rode ESTE script depois, no SQL Editor do Supabase, para adicionar as duas
-- coisas que o Prisma não modela: o trigger que cria o perfil público do
-- usuário no cadastro, e as políticas de Row Level Security (RLS).
--
-- Ordem de execução:
--   1) npx prisma migrate dev   (cria as tabelas)
--   2) rode este arquivo no SQL Editor do Supabase


-- =========================================================================
-- 1) Trigger: ao criar um usuário em auth.users (via supabase.auth.signUp
--    ou pela Admin API), cria automaticamente a linha correspondente em
--    public."User" com o mesmo id (uuid), lendo o nome de user_metadata.
-- =========================================================================

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public."User" (id, name, email, role, "sellerStatus", "vortexPoints", suspended, "createdAt", "updatedAt")
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    new.email,
    'BUYER',
    'NONE',
    0,
    false,
    now(),
    now()
  )
  on conflict (id) do nothing;

  insert into public."Wallet" (id, "userId", balance, "updatedAt")
  values (gen_random_uuid()::text, new.id, 0, now())
  on conflict ("userId") do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();


-- Mantém o e-mail em public."User" sincronizado se o usuário trocar o
-- e-mail pelo Supabase Auth.
create or replace function public.handle_user_email_update()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  update public."User" set email = new.email, "updatedAt" = now() where id = new.id;
  return new;
end;
$$;

drop trigger if exists on_auth_user_email_updated on auth.users;
create trigger on_auth_user_email_updated
  after update of email on auth.users
  for each row execute procedure public.handle_user_email_update();


-- =========================================================================
-- 2) Row Level Security (RLS)
--
-- IMPORTANTE — leia antes de rodar: o back-end do Vexiro (rotas em app/api)
-- acessa o banco pelo Prisma, usando DATABASE_URL/DIRECT_URL — uma conexão
-- Postgres direta, autenticada como o usuário "postgres", não pela API
-- REST/GraphQL do Supabase com a chave anônima. Por causa disso, o Prisma
-- NÃO passa pelas políticas de RLS abaixo (a validação de "quem pode ver o
-- quê" já é feita no código de cada rota, via getCurrentUser()).
--
-- As policies abaixo protegem as tabelas caso algo (agora ou no futuro)
-- passe a consultá-las diretamente pelo cliente Supabase no navegador
-- (com a chave publishable/anon) — é defesa em profundidade, recomendada
-- pelo próprio Supabase, e também remove o aviso "Unrestricted" do painel.
-- =========================================================================

alter table public."User" enable row level security;
alter table public."Wallet" enable row level security;
alter table public."WalletTransaction" enable row level security;
alter table public."Product" enable row level security;
alter table public."Category" enable row level security;
alter table public."Order" enable row level security;
alter table public."OrderItem" enable row level security;
alter table public."Payment" enable row level security;
alter table public."Favorite" enable row level security;
alter table public."Review" enable row level security;
alter table public."Notification" enable row level security;
alter table public."Conversation" enable row level security;
alter table public."Message" enable row level security;
alter table public."Report" enable row level security;
alter table public."Withdrawal" enable row level security;
alter table public."Coupon" enable row level security;
alter table public."AuditLog" enable row level security;

-- Produtos e categorias: leitura pública (é um marketplace, o catálogo é
-- público), escrita só pelo próprio vendedor dono do produto.
create policy "Produtos são públicos para leitura" on public."Product"
  for select using (true);
create policy "Vendedor gerencia seus próprios produtos" on public."Product"
  for all using (auth.uid() = "sellerId");

create policy "Categorias são públicas para leitura" on public."Category"
  for select using (true);

-- Perfil: qualquer um pode ver dados públicos de perfil (nome, loja),
-- mas só o próprio usuário edita o seu.
create policy "Perfis são públicos para leitura" on public."User"
  for select using (true);
create policy "Usuário edita seu próprio perfil" on public."User"
  for update using (auth.uid() = id);

-- Carteira, notificações, favoritos, pedidos, mensagens: só o próprio dono.
create policy "Usuário vê sua própria carteira" on public."Wallet"
  for select using (auth.uid() = "userId");
create policy "Usuário vê suas próprias transações" on public."WalletTransaction"
  for select using (exists (select 1 from public."Wallet" w where w.id = "walletId" and w."userId" = auth.uid()));

create policy "Comprador vê seus próprios pedidos" on public."Order"
  for select using (auth.uid() = "buyerId");
create policy "Comprador vê os itens dos próprios pedidos" on public."OrderItem"
  for select using (exists (select 1 from public."Order" o where o.id = "orderId" and o."buyerId" = auth.uid()));

create policy "Usuário gerencia seus próprios favoritos" on public."Favorite"
  for all using (auth.uid() = "userId");

create policy "Avaliações são públicas para leitura" on public."Review"
  for select using (true);
create policy "Usuário gerencia suas próprias avaliações" on public."Review"
  for insert with check (auth.uid() = "userId");

create policy "Usuário vê suas próprias notificações" on public."Notification"
  for select using (auth.uid() = "userId");

create policy "Participantes veem a própria conversa" on public."Conversation"
  for select using (auth.uid() = "buyerId" or auth.uid() = "sellerId");
create policy "Participantes veem as próprias mensagens" on public."Message"
  for select using (
    exists (
      select 1 from public."Conversation" c
      where c.id = "conversationId" and (c."buyerId" = auth.uid() or c."sellerId" = auth.uid())
    )
  );
create policy "Participantes enviam mensagens na própria conversa" on public."Message"
  for insert with check (auth.uid() = "senderId");

create policy "Usuário vê seus próprios saques" on public."Withdrawal"
  for select using (auth.uid() = "userId");

create policy "Usuário vê suas próprias denúncias" on public."Report"
  for select using (auth.uid() = "reporterId");

-- Cupons ativos: leitura pública (necessário para validar cupom no checkout).
create policy "Cupons ativos são públicos para leitura" on public."Coupon"
  for select using (active = true);

-- Pagamentos e logs de auditoria: nenhum acesso direto pelo cliente — só o
-- back-end (Prisma, que não passa por RLS) lida com essas tabelas.
-- Nenhuma policy = acesso negado por padrão para as roles anon/authenticated.
