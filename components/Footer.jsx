"use client";

import Link from "next/link";
import { Zap } from "lucide-react";

export default function Footer() {
  return (
    <footer className="border-t border-white/10 mt-16 py-10 px-4 sm:px-6">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between gap-6 text-sm text-white/50">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Zap className="w-4 h-4 text-cyan-300" fill="currentColor" />
            <span className="font-display text-white tracking-wide">VEXIRO</span>
          </div>
          <p className="max-w-xs">O marketplace gamer para comprar e vender produtos digitais com segurança e entrega automática.</p>
        </div>
        <div className="flex gap-10 flex-wrap">
          <div>
            <p className="text-white/80 font-semibold mb-2">Plataforma</p>
            <Link href="/seller" className="block hover:text-cyan-300 mb-1">Vender na Vexiro</Link>
            <Link href="/support" className="block hover:text-cyan-300 mb-1">Suporte</Link>
            <Link href="/admin" className="block hover:text-cyan-300">Área administrativa</Link>
          </div>
          <div>
            <p className="text-white/80 font-semibold mb-2">Pagamento</p>
            <p className="mb-1">PIX instantâneo</p>
            <p>Entrega digital automática</p>
          </div>
        </div>
      </div>
      <div className="max-w-7xl mx-auto mt-8 pt-6 border-t border-white/5 text-xs text-white/30">
        © 2026 Vexiro Marketplace. Todos os direitos reservados.
      </div>
    </footer>
  );
}
