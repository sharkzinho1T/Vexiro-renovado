import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";

// Renova o token de sessão do Supabase a cada requisição (necessário porque
// o middleware roda no Edge Runtime e não pode usar o client do servidor
// baseado em next/headers). Retorna a resposta já com os cookies atualizados
// e o usuário autenticado (ou null).
export async function updateSession(request) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  return { response, user };
}
