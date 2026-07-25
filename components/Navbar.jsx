"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useUser } from "../hooks/useUser";
import { createClient } from "../lib/supabase/client";
import {
  Search, ShoppingCart, Menu, X, ChevronRight, Zap, Bell, LogOut, User as UserIcon, Gamepad2,
} from "lucide-react";
import { Glass, GAME_ICONS } from "./ui";
import { useCart } from "./CartContext";

export default function Navbar() {
  const { user } = useUser();
  const { count } = useCart();
  const router = useRouter();
  const [mobileMenu, setMobileMenu] = useState(false);
  const [query, setQuery] = useState("");
  const [unread, setUnread] = useState(0);
  const [games, setGames] = useState([]);

  useEffect(() => {
    fetch("/api/categories?featured=true")
      .then((r) => r.json())
      .then((data) => setGames(data.categories || []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!user) return;
    let active = true;
    async function poll() {
      try {
        const res = await fetch("/api/notifications");
        if (!res.ok) return;
        const data = await res.json();
        if (active) setUnread(data.unread || 0);
      } catch (e) {
        /* silencioso */
      }
    }
    poll();
    const id = setInterval(poll, 20000);
    return () => {
      active = false;
      clearInterval(id);
    };
  }, [user]);

  function submitSearch(e) {
    e.preventDefault();
    router.push(`/?q=${encodeURIComponent(query)}`);
    setMobileMenu(false);
  }

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-[#05050c]/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center gap-4">
        <button className="lg:hidden text-white/80" onClick={() => setMobileMenu((v) => !v)}>
          {mobileMenu ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>

        <Link href="/" className="flex items-center gap-2 shrink-0 group">
          <div className="relative w-8 h-8">
            <div
              className="absolute inset-0 rounded-full border-2 border-transparent bg-gradient-to-tr from-[#3D5CFF] to-[#9333EA] vortex-ring"
              style={{
                WebkitMask: "radial-gradient(farthest-side, transparent calc(100% - 3px), black calc(100% - 3px))",
                mask: "radial-gradient(farthest-side, transparent calc(100% - 3px), black calc(100% - 3px))",
              }}
            />
            <div className="absolute inset-[5px] rounded-full bg-[#050510] flex items-center justify-center">
              <Zap className="w-3.5 h-3.5 text-cyan-300" fill="currentColor" />
            </div>
          </div>
          <span className="font-display text-lg tracking-wider text-white">VEXIRO</span>
        </Link>

        <nav className="hidden lg:flex items-center gap-6 ml-4 text-sm text-white/70">
          <Link href="/" className="hover:text-white transition">Início</Link>
          <div className="relative group">
            <button className="hover:text-white transition flex items-center gap-1">
              Jogos <ChevronRight className="w-3.5 h-3.5 rotate-90" />
            </button>
            <div className="absolute top-full left-0 pt-3 hidden group-hover:block">
              <Glass className="rounded-xl p-2 w-52 shadow-2xl shadow-black/50">
                {games.map((g) => {
                  const Icon = GAME_ICONS[g.slug] || Gamepad2;
                  return (
                    <Link key={g.slug} href={`/?category=${g.slug}`} className="w-full text-left px-3 py-2 rounded-lg hover:bg-white/10 flex items-center gap-2 text-sm">
                      <Icon className="w-4 h-4 text-cyan-300" /> {g.name}
                    </Link>
                  );
                })}
                <div className="border-t border-white/10 mt-1 pt-1">
                  <Link href="/categorias" className="w-full text-left px-3 py-2 rounded-lg hover:bg-white/10 flex items-center gap-2 text-sm text-white/60">
                    Ver todas as categorias
                  </Link>
                </div>
              </Glass>
            </div>
          </div>
          <Link href="/?category=all" className="hover:text-white transition">Produtos</Link>
          <Link href="/sellers" className="hover:text-white transition">Vendedores</Link>
          <Link href="/support" className="hover:text-white transition">Suporte</Link>
        </nav>

        <form onSubmit={submitSearch} className="flex-1 hidden md:flex items-center">
          <div className="relative w-full max-w-md ml-4">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar jogos, produtos ou vendedores..."
              className="w-full bg-white/5 border border-white/10 rounded-full pl-9 pr-3 py-2 text-sm placeholder:text-white/30 focus:outline-none focus:border-cyan-400/50 focus:bg-white/[0.07] transition"
            />
          </div>
        </form>

        <div className="ml-auto flex items-center gap-2">
          {user && (
            <Link href="/profile?tab=notificacoes" className="relative p-2.5 rounded-full hover:bg-white/10 transition">
              <Bell className="w-5 h-5" />
              {unread > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-gradient-to-br from-[#3D5CFF] to-[#9333EA] text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                  {unread > 9 ? "9+" : unread}
                </span>
              )}
            </Link>
          )}

          <Link href="/cart" className="relative p-2.5 rounded-full hover:bg-white/10 transition">
            <ShoppingCart className="w-5 h-5" />
            {count > 0 && (
              <span className="absolute -top-0.5 -right-0.5 bg-gradient-to-br from-[#3D5CFF] to-[#9333EA] text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                {count}
              </span>
            )}
          </Link>

          {user ? (
            <div className="relative group">
              <Link href="/profile" className="flex items-center gap-2 pl-1 pr-3 py-1 rounded-full border border-white/10 hover:border-cyan-400/40 transition">
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-cyan-400 to-[#3D5CFF] flex items-center justify-center text-xs font-bold">
                  {user.name?.[0]?.toUpperCase()}
                </div>
                <span className="hidden sm:block text-sm">{user.name}</span>
              </Link>
              <div className="absolute top-full right-0 pt-3 hidden group-hover:block">
                <Glass className="rounded-xl p-2 w-44 shadow-2xl shadow-black/50">
                  <Link href="/profile" className="w-full text-left px-3 py-2 rounded-lg hover:bg-white/10 flex items-center gap-2 text-sm">
                    <UserIcon className="w-4 h-4" /> Meu perfil
                  </Link>
                  {["SELLER", "ADMIN"].includes(user.role) && (
                    <Link href="/seller" className="w-full text-left px-3 py-2 rounded-lg hover:bg-white/10 flex items-center gap-2 text-sm">
                      Painel do vendedor
                    </Link>
                  )}
                  {user.role === "ADMIN" && (
                    <Link href="/admin" className="w-full text-left px-3 py-2 rounded-lg hover:bg-white/10 flex items-center gap-2 text-sm">
                      Administração
                    </Link>
                  )}
                  <button onClick={async () => { await createClient().auth.signOut(); router.push("/"); router.refresh(); }} className="w-full text-left px-3 py-2 rounded-lg hover:bg-white/10 flex items-center gap-2 text-sm text-red-300">
                    <LogOut className="w-4 h-4" /> Sair
                  </button>
                </Glass>
              </div>
            </div>
          ) : (
            <Link href="/login" className="px-4 py-2 rounded-full text-sm font-semibold bg-gradient-to-r from-[#3D5CFF] to-[#9333EA] hover:shadow-[0_0_20px_rgba(147,51,234,0.5)] transition">
              Entrar / Cadastrar
            </Link>
          )}
        </div>
      </div>

      {mobileMenu && (
        <div className="lg:hidden border-t border-white/10 px-4 py-3 space-y-1 bg-[#05050c]">
          <form onSubmit={submitSearch} className="relative mb-2">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar..." className="w-full bg-white/5 border border-white/10 rounded-full pl-9 pr-3 py-2 text-sm" />
          </form>
          <Link href="/" onClick={() => setMobileMenu(false)} className="block px-3 py-2 rounded-lg hover:bg-white/10 text-sm">Início</Link>
          <Link href="/sellers" onClick={() => setMobileMenu(false)} className="block px-3 py-2 rounded-lg hover:bg-white/10 text-sm">Vendedores</Link>
          <Link href="/support" onClick={() => setMobileMenu(false)} className="block px-3 py-2 rounded-lg hover:bg-white/10 text-sm">Suporte</Link>
          {games.map((g) => {
            const Icon = GAME_ICONS[g.slug] || Gamepad2;
            return (
              <Link key={g.slug} href={`/?category=${g.slug}`} onClick={() => setMobileMenu(false)} className="px-3 py-2 rounded-lg hover:bg-white/10 text-sm flex items-center gap-2">
                <Icon className="w-4 h-4 text-cyan-300" /> {g.name}
              </Link>
            );
          })}
          <Link href="/categorias" onClick={() => setMobileMenu(false)} className="block px-3 py-2 rounded-lg hover:bg-white/10 text-sm text-white/60">Ver todas as categorias</Link>
        </div>
      )}
    </header>
  );
}
