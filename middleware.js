import { NextResponse } from "next/server";
import { updateSession } from "./lib/supabase/middleware";

const PROTECTED_PREFIXES = ["/admin", "/seller", "/profile", "/checkout", "/chat"];

export async function middleware(request) {
  const { response, user } = await updateSession(request);

  const { pathname } = request.nextUrl;
  const isProtected = PROTECTED_PREFIXES.some((p) => pathname.startsWith(p));

  if (isProtected && !user) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Autorização fina por papel (admin/vendedor) é reforçada nas próprias
  // páginas e rotas de API, que já consultam o perfil via getCurrentUser().
  // O middleware roda no Edge Runtime e evita fazer consultas ao Prisma aqui.
  return response;
}

export const config = {
  matcher: ["/admin/:path*", "/seller/:path*", "/profile/:path*", "/checkout/:path*", "/chat/:path*"],
};
