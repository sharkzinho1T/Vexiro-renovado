"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Gamepad2 } from "lucide-react";
import { Glass, GAME_ICONS } from "../../components/ui";

export default function CategoriasPage() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/categories")
      .then((r) => r.json())
      .then((data) => setCategories(data.categories || []))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-14">
      <h1 className="font-display text-2xl text-white mb-2">Todas as categorias</h1>
      <p className="text-white/50 text-sm mb-8">Escolha um jogo para ver os produtos disponíveis.</p>

      {loading ? (
        <p className="text-white/40 text-sm">Carregando...</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {categories.map((c) => {
            const Icon = GAME_ICONS[c.slug] || Gamepad2;
            return (
              <Link
                key={c.slug}
                href={`/?category=${c.slug}`}
                className="group rounded-2xl overflow-hidden border border-white/10 hover:border-cyan-400/40 transition relative"
              >
                {c.imageUrl ? (
                  <div className="relative h-28">
                    <img src={c.imageUrl} alt={c.name} className="w-full h-full object-cover group-hover:scale-105 transition duration-300" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />
                    <p className="absolute bottom-2 left-3 text-sm font-semibold text-white">{c.name}</p>
                  </div>
                ) : (
                  <Glass className="h-28 flex flex-col items-center justify-center gap-2 bg-white/[0.03]">
                    <Icon className="w-6 h-6 text-cyan-300" />
                    <p className="text-sm font-semibold text-white text-center px-2">{c.name}</p>
                  </Glass>
                )}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
