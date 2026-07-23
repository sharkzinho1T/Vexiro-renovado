import { createClient } from "./supabase/server";
import { prisma } from "./prisma";

// Retorna o usuário autenticado (Supabase Auth) já combinado com o perfil
// público (public.User: role, sellerStatus, etc.). Mantém o mesmo formato
// que as ~27 rotas de API já esperavam, então nenhuma delas precisou mudar.
export async function getCurrentUser() {
  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser) return null;

  const profile = await prisma.user.findUnique({ where: { id: authUser.id } });
  if (!profile) return null; // trigger de criação de perfil ainda não rodou / falhou
  if (profile.suspended) return null;

  return {
    id: profile.id,
    name: profile.name,
    email: profile.email,
    role: profile.role,
    sellerStatus: profile.sellerStatus,
    avatarUrl: profile.avatarUrl,
  };
}

export function requireRole(user, roles) {
  return !!user && roles.includes(user.role);
}
