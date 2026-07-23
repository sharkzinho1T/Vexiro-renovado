"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { BadgeCheck } from "lucide-react";
import { Glass } from "../../components/ui";

export default function SellersPage() {
  const [sellers, setSellers] = useState([]);

  useEffect(() => {
    fetch("/api/products")
      .then((r) => r.json())
      .then((data) => {
        const map = new Map();
        (data.products || []).forEach((p) => {
          if (!map.has(p.seller.id)) {
            map.set(p.seller.id, { ...p.seller, productCount: 0 });
          }
          map.get(p.seller.id).productCount += 1;
        });
        setSellers(Array.from(map.values()));
      });
  }, []);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-14">
      <h1 className="font-display text-2xl mb-2">Vendedores da Vexiro</h1>
      <p className="text-white/50 text-sm mb-8">Vendedores verificados passam por aprovação da equipe Vexiro.</p>

      {sellers.length === 0 ? (
        <Glass className="rounded-2xl p-10 text-center text-white/50">Ainda não há vendedores com produtos publicados.</Glass>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {sellers.map((s) => (
            <Glass key={s.id} className="rounded-2xl p-6">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#3D5CFF] to-[#9333EA] flex items-center justify-center font-bold mb-3">
                {(s.sellerName || s.name)[0]}
              </div>
              <div className="flex items-center gap-1.5 mb-1">
                <p className="font-semibold">{s.sellerName || s.name}</p>
                {s.sellerStatus === "VERIFIED" && (
                  <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full bg-cyan-400/10 border border-cyan-400/30 text-cyan-300 font-semibold">
                    <BadgeCheck className="w-3 h-3" /> Verificado
                  </span>
                )}
              </div>
              <p className="text-xs text-white/40 mb-3">{s.productCount} produtos anunciados</p>
              <Link href={`/?sellerId=${s.id}`} className="text-xs text-cyan-300">Ver produtos</Link>
            </Glass>
          ))}
        </div>
      )}

      <Glass className="rounded-2xl p-8 mt-10 text-center">
        <h3 className="font-display text-lg mb-2">Quer vender na Vexiro?</h3>
        <p className="text-white/50 text-sm mb-5 max-w-md mx-auto">Crie sua loja, publique produtos e receba via PIX.</p>
        <Link href="/seller" className="px-6 py-3 rounded-full font-semibold bg-gradient-to-r from-[#3D5CFF] to-[#9333EA]">Começar a vender</Link>
      </Glass>
    </div>
  );
}
