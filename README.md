# Vexiro — Marketplace Gamer

Marketplace completo para compra e venda de produtos digitais de jogos (Free Fire, Roblox, Minecraft, Fortnite, Valorant e outros), construído com **Next.js 14 (App Router)**, **Prisma + PostgreSQL (Supabase)**, **Supabase Auth** e **Tailwind CSS**.

Diferente de um protótipo visual, este projeto é um **back-end real**: autenticação com senha criptografada, banco de dados relacional, carrinho/checkout que gera cobranças PIX de verdade (via Mercado Pago), carteira interna, chat entre comprador e vendedor, notificações, avaliações, cupons e painel administrativo — tudo persistido em banco de dados.

## 1. O que já funciona de verdade, assim que você configurar o banco

- Cadastro e login reais (senha com bcrypt, sessão JWT)
- Catálogo, busca e categorias vindos do banco de dados
- Carrinho (local) → Checkout → Pedido salvo no banco
- Carteira interna, Vortex Points, histórico de compras
- Vendedores: cadastro de produtos, estoque, vendas, saldo e solicitação de saque
- Selo de "Vendedor Verificado" (concedido pelo admin)
- Chat comprador ↔ vendedor (banco de dados + atualização automática)
- Notificações internas (compra, venda, saque, mensagens)
- Avaliações (somente de quem comprou o produto)
- Cupons de desconto
- Painel administrativo: usuários, aprovação de vendedores, denúncias, cupons, dashboard
- Rate limiting em rotas sensíveis e log de auditoria

## 2. O que depende de você criar uma conta externa (gratuita)

| Recurso | Por quê | Onde criar |
|---|---|---|
| Banco de dados PostgreSQL | Guardar usuários, produtos, pedidos etc. | [supabase.com](https://supabase.com) (grátis) |
| Pagamento PIX real | Receber dinheiro de verdade dos compradores | [mercadopago.com.br/developers](https://www.mercadopago.com.br/developers) |

**Sem a chave do Mercado Pago configurada, o checkout roda em modo de simulação** (gera um código PIX de teste e o botão "Já paguei" aprova automaticamente) — assim dá para testar o fluxo inteiro antes de ligar o pagamento real.

## 3. Rodando localmente

Pré-requisito: [Node.js](https://nodejs.org) 18+.

1. Crie um projeto gratuito em [supabase.com](https://supabase.com) (leva ~2 minutos).
2. No painel do projeto: **Project Settings → Database → Connection string**.
   - Copie a URL da aba **Transaction** (porta `6543`) → cole em `DATABASE_URL`.
   - Copie a URL da aba **Session** / **Direct connection** (porta `5432`) → cole em `DIRECT_URL`.
   - Troque `[YOUR-PASSWORD]` pela senha do banco que você definiu ao criar o projeto.
3. No painel do projeto: **Project Settings → API**.
   - Copie **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`.
   - Copie a chave **anon** / **publishable** → `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.
   - Copie a chave **service_role** → `SUPABASE_SERVICE_ROLE_KEY` (secreta — nunca no navegador).

```bash
npm install
cp .env.example .env
# cole as 5 variáveis do Supabase no .env (DATABASE_URL, DIRECT_URL,
# NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, SUPABASE_SERVICE_ROLE_KEY)

npx prisma migrate dev   # aplica as migrations em prisma/migrations/ e cria todas as tabelas
```

Depois, rode **uma vez** o script `supabase/auth-trigger.sql` no **SQL Editor** do painel do Supabase (cria o trigger que gera o perfil do usuário automaticamente no cadastro, e as políticas de RLS).

```bash
npm run db:seed   # cria categorias + conta admin + vendedor de demonstração
npm run dev
```

Acesse http://localhost:3000

**Login criado pelo seed:**
- Admin: `admin@vexiro.com` / senha definida em `SEED_ADMIN_PASSWORD` no `.env` (padrão: `TrocarSenha123!`)
- Vendedor de demonstração: `vendedor@vexiro.com` / `Vendedor123!`

## 4. Publicando na Vercel

1. Se ainda não fez, crie o projeto no Supabase e pegue as 5 variáveis (seção 3 acima).
2. Suba este projeto para um repositório no GitHub — **inclua a pasta `prisma/migrations/`**, ela precisa estar no repositório.
3. Importe o repositório em [vercel.com/new](https://vercel.com/new).
4. Em **Settings → Environment Variables**, adicione (nos ambientes Production e Preview):
   - `DATABASE_URL`
   - `DIRECT_URL`
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `MERCADOPAGO_ACCESS_TOKEN` (opcional, para PIX real)
   - `MERCADOPAGO_WEBHOOK_URL` → `https://SEUDOMINIO/api/webhooks/mercadopago`
5. Clique em **Deploy**. O comando de build (`npm run build`) já roda `prisma migrate deploy` automaticamente antes de compilar — ou seja, **as tabelas são criadas/atualizadas sozinhas a cada deploy**, sem precisar rodar nada manualmente depois.
6. Rode **uma vez**, manualmente, o script `supabase/auth-trigger.sql` no SQL Editor do Supabase (isso não faz parte do build — é só um script SQL avulso).
7. Se quiser os dados de demonstração em produção, rode `npm run db:seed` localmente, apontando pro `.env` com as credenciais de produção.
8. No painel do Mercado Pago, cadastre a URL do webhook (`MERCADOPAGO_WEBHOOK_URL`) em **Notificações**.

## 5. Estrutura do projeto

```
vexiro/
├── prisma/
│   ├── schema.prisma       # todas as tabelas (users, products, orders, wallet, chat, etc.)
│   ├── migrations/          # histórico de migrations do banco — aplicado sozinho no build
│   └── seed.js             # categorias + admin + vendedor + produtos de exemplo
├── supabase/
│   └── auth-trigger.sql    # trigger de criação de perfil + políticas de RLS (rodar 1x no Supabase)
├── lib/                    # prisma client, supabase (client/server/middleware), pagamentos,
│                            # sessão, rate limit, auditoria, fulfillment (entrega/carteira)
├── app/
│   ├── api/                 # todas as rotas de back-end (produtos, pedidos,
│   │                         # pagamentos, webhook, carteira, chat, admin...)
│   ├── login, register, forgot-password, reset-password, product/[id], cart, checkout,
│   │   profile, seller, admin, chat, sellers, support     # páginas
│   ├── layout.js, page.js, globals.css
├── components/              # Navbar, Footer, ProductCard, CartContext, Toast, UI
├── hooks/
│   └── useUser.js           # substitui o useSession() do NextAuth
├── middleware.js             # protege /admin, /seller, /profile, /checkout, /chat
└── .env.example
```

## 6. Limitações conhecidas (honestidade acima de tudo)

- **Chat** funciona por atualização automática a cada poucos segundos (polling), não por WebSocket — suficiente para uso real, mas não é "tempo real" instantâneo. Para isso, integre Pusher ou Ably no futuro.
- **Saques para vendedores** ficam registrados no banco como solicitação — o envio do PIX de saída para a chave do vendedor precisa ser feito manualmente (ou via API de Payouts do seu gateway), pois gateways brasileiros exigem validação de compliance para transferências automáticas.
- **E-mail transacional** (confirmação de cadastro, recuperação de senha) e **push notification** ainda não estão implementados — hoje as notificações são só internas (dentro do site). Para e-mail, a opção mais simples é integrar [Resend](https://resend.com).
- **2FA e captcha** não implementados nesta versão.
- **Upload de imagens de produto** ainda não tem interface — o campo `images` existe no banco, mas a tela de "adicionar produto" ainda não tem um seletor de arquivo (hoje aceita URL). Para upload real, integre algo como Vercel Blob ou Cloudinary.

Essas são as próximas peças naturais a adicionar — o núcleo (autenticação, banco, catálogo, carrinho, pagamento, carteira, chat, admin) já está todo real e funcional.
