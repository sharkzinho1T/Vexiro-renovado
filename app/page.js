"use client";

import { useEffect, useState, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useUser } from "../hooks/useUser";
import { TrendingUp, ChevronRight, Sparkles, Zap, Gamepad2 } from "lucide-react";
import { Glass, StarRow, money } from "../components/ui";
import ProductCard from "../components/ProductCard";
import { useToast } from "../components/Toast";

function HomeInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user } = useUser();
  const toast = useToast();

  const category = searchParams.get("category") || "all";
  const q = searchParams.get("q") || "";

  const [products, setProducts] = useState([]);
  const [featured, setFeatured] = useState([]);
  const [sellers, setSellers] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [games, setGames] = useState([]);

  useEffect(() => {
    fetch("/api/categories?featured=true")
      .then((r) => r.json())
      .then((data) => setGames(data.categories || []));
  }, []);

  const loadFavorites = useCallback(async () => {
    if (!user) return;
    const res = await fetch("/api/favorites");
    if (res.ok) {
      const data = await res.json();
      setFavorites(data.favorites.map((f) => f.productId));
    }
  }, [user]);

  useEffect(() => {
    loadFavorites();
  }, [loadFavorites]);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (category !== "all") params.set("category", category);
    if (q) params.set("q", q);

    fetch(`/api/products?${params.toString()}`)
      .then((r) => r.json())
      .then((data) => setProducts(data.products || []))
      .finally(() => setLoading(false));
  }, [category, q]);

  useEffect(() => {
    fetch("/api/products")
      .then((r) => r.json())
      .then((data) => setFeatured((data.products || []).slice(0, 4)));
  }, []);

  async function toggleFavorite(productId) {
    const res = await fetch("/api/favorites", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId }),
    });
    if (res.ok) {
      const data = await res.json();
      setFavorites((prev) => (data.favorited ? [...prev, productId] : prev.filter((id) => id !== productId)));
      toast(data.favorited ? "Adicionado aos favoritos" : "Removido dos favoritos", "success");
    }
  }

  function goCategory(slug) {
    const params = new URLSearchParams(searchParams.toString());
    if (slug === "all") params.delete("category");
    else params.set("category", slug);
    router.push(`/?${params.toString()}`);
  }

  return (
    <div>
      {/* HERO */}
      <section className="relative overflow-hidden border-b border-white/10">
        <div className="absolute inset-0">
          <div className="absolute -top-40 -left-40 w-[500px] h-[500px] rounded-full bg-[#3D5CFF]/20 blur-[120px]" />
          <div className="absolute top-20 right-0 w-[400px] h-[400px] rounded-full bg-[#9333EA]/20 blur-[120px]" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-16 sm:py-24 grid lg:grid-cols-2 gap-10 items-center">
          <div>
            <span className="inline-flex items-center gap-2 text-xs font-semibold text-cyan-300 bg-cyan-400/10 border border-cyan-400/30 rounded-full px-3 py-1 mb-5">
              <Sparkles className="w-3.5 h-3.5" /> Semana Vexiro — até 40% OFF em produtos selecionados
            </span>
            <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl leading-[1.05] font-800 text-white">
              O <span className="bg-gradient-to-r from-[#5B7CFF] via-[#9B5CFF] to-cyan-300 bg-clip-text text-transparent">portal</span> para negociar seus jogos
            </h1>
            <p className="mt-5 text-white/60 max-w-lg leading-relaxed">
              Compre e venda contas, moedas, skins e gift cards de Free Fire, Roblox, Minecraft, Fortnite, Valorant e muito mais — com entrega digital automática e pagamento via PIX.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <button onClick={() => document.getElementById("catalogo")?.scrollIntoView({ behavior: "smooth" })} className="px-6 py-3 rounded-full font-semibold bg-gradient-to-r from-[#3D5CFF] to-[#9333EA] hover:shadow-[0_0_30px_rgba(147,51,234,0.5)] transition flex items-center gap-2">
                Comprar agora <ChevronRight className="w-4 h-4" />
              </button>
              <a href="/seller" className="px-6 py-3 rounded-full font-semibold border border-white/15 hover:bg-white/5 transition">
                Vender na Vexiro
              </a>
            </div>
          </div>

          <div className="relative hidden lg:flex items-center justify-center">
            <div className="relative w-80 h-80">
              <div className="absolute inset-0 rounded-full border border-white/10 vortex-ring" />
              <div className="absolute inset-8 rounded-full border border-dashed border-cyan-400/30 vortex-ring-rev" />
              <div className="absolute inset-16 rounded-full bg-gradient-to-br from-[#3D5CFF]/30 to-[#9333EA]/30 blur-2xl glow-pulse" />
              <Glass className="absolute inset-20 rounded-3xl flex flex-col items-center justify-center gap-2 shadow-2xl float-anim">
                <Zap className="w-10 h-10 text-cyan-300" fill="currentColor" />
                <p className="font-display text-sm text-white">VORTEX POINTS</p>
                <p className="text-xs text-white/40">Ganhe a cada compra</p>
              </Glass>
            </div>
          </div>
        </div>
      </section>

      {/* CATEGORIES */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-14">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-display text-xl text-white">Categorias em destaque</h2>
          <a href="/categorias" className="text-sm text-cyan-300 hover:text-cyan-200 transition">Ver todas →</a>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          <button onClick={() => goCategory("all")} className={`group rounded-2xl p-4 border transition text-left flex flex-col items-start justify-end h-32 ${category === "all" ? "border-cyan-400/50 bg-cyan-400/5" : "border-white/10 bg-white/[0.03] hover:border-white/25"}`}>
            <Gamepad2 className="w-6 h-6 text-white/70 mb-3 group-hover:text-cyan-300 transition" />
            <p className="text-sm font-semibold">Todos</p>
          </button>
          {games.map((g) => {
            const active = category === g.slug;
            return (
              <button
                key={g.slug}
                onClick={() => goCategory(g.slug)}
                className={`group relative rounded-2xl overflow-hidden border transition text-left h-32 ${active ? "border-cyan-400/60" : "border-white/10 hover:border-white/30"}`}
              >
                {g.imageUrl && (
                  <img src={g.imageUrl} alt={g.name} className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition duration-300" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-black/0" />
                <p className="absolute bottom-3 left-3 text-sm font-semibold text-white">{g.name}</p>
              </button>
            );
          })}
        </div>
      </section>

      {/* FEATURED */}
      {featured.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
          <h2 className="font-display text-xl text-white flex items-center gap-2 mb-6"><TrendingUp className="w-5 h-5 text-cyan-300" /> Produtos em destaque</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {featured.map((p) => (
              <ProductCard key={p.id} product={p} isFavorite={favorites.includes(p.id)} onToggleFavorite={toggleFavorite} />
            ))}
          </div>
        </section>
      )}

      {/* CATALOG */}
      <section id="catalogo" className="max-w-7xl mx-auto px-4 sm:px-6 py-14">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-display text-xl text-white">
            {category === "all" ? "Catálogo completo" : (games.find((g) => g.slug === category)?.name || products[0]?.category?.name || category)}
            {q && <span className="text-white/40 text-sm font-normal ml-2">— resultados para "{q}"</span>}
          </h2>
          <span className="text-sm text-white/40">{loading ? "carregando..." : `${products.length} produtos`}</span>
        </div>
        {!loading && products.length === 0 ? (
          <Glass className="rounded-2xl p-10 text-center text-white/50">Nenhum produto encontrado. Tente outra busca ou categoria.</Glass>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {products.map((p) => (
              <ProductCard key={p.id} product={p} isFavorite={favorites.includes(p.id)} onToggleFavorite={toggleFavorite} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<div className="max-w-7xl mx-auto px-6 py-20 text-white/40">Carregando...</div>}>
      <HomeInner />
    </Suspense>
  );
}
