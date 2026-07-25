"use client";

import { createBrowserClient } from "@supabase/ssr";

// Cliente Supabase para uso no navegador (Client Components).
//
// IMPORTANTE: mantemos uma única instância (singleton) em todo o app.
// Várias páginas (Navbar, useUser, profile, login, etc.) chamam
// createClient() de forma independente. Se cada chamada criasse um novo
// createBrowserClient(), teríamos múltiplas instâncias de GoTrueClient
// ativas ao mesmo tempo, cada uma com seu próprio timer de auto-refresh
// do token — e elas entram em conflito entre si (e com o middleware),
// derrubando a sessão do usuário ao navegar entre páginas. Por isso
// reaproveitamos sempre o mesmo client no navegador.
let browserClient;

export function createClient() {
  if (!browserClient) {
    browserClient = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
    );
  }
  return browserClient;
}
