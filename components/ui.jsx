"use client";

import { Star, BadgeCheck, Flame, Box, Pickaxe, Swords, Crosshair, Sparkles, Gamepad2 } from "lucide-react";

export const GAME_ICONS = {
  freefire: Flame,
  roblox: Box,
  minecraft: Pickaxe,
  fortnite: Swords,
  valorant: Crosshair,
  "cs2": Crosshair,
  "league-of-legends": Swords,
  "genshin-impact": Sparkles,
  outros: Sparkles,
};

export const GAME_GRADIENTS = {
  freefire: "from-orange-500 to-red-600",
  roblox: "from-rose-400 to-fuchsia-600",
  minecraft: "from-emerald-500 to-lime-600",
  fortnite: "from-violet-500 to-indigo-600",
  valorant: "from-red-500 to-pink-600",
  "cs2": "from-yellow-500 to-orange-600",
  "league-of-legends": "from-blue-500 to-cyan-600",
  "genshin-impact": "from-amber-400 to-purple-600",
  outros: "from-cyan-400 to-blue-600",
};

export function money(v) {
  return Number(v).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function Glass({ className = "", children, ...rest }) {
  return (
    <div className={`bg-white/[0.04] backdrop-blur-xl border border-white/10 ${className}`} {...rest}>
      {children}
    </div>
  );
}

export function VerifiedBadge({ size = "sm" }) {
  const s = size === "sm" ? "text-[10px] px-1.5 py-0.5 gap-0.5" : "text-xs px-2 py-1 gap-1";
  return (
    <span className={`inline-flex items-center ${s} rounded-full bg-cyan-400/10 border border-cyan-400/30 text-cyan-300 font-semibold whitespace-nowrap`}>
      <BadgeCheck className={size === "sm" ? "w-3 h-3" : "w-3.5 h-3.5"} />
      Verificado
    </span>
  );
}

export function ProductCover({ categorySlug, className = "" }) {
  const Icon = GAME_ICONS[categorySlug] || Gamepad2;
  const grad = GAME_GRADIENTS[categorySlug] || "from-cyan-400 to-blue-600";
  return (
    <div className={`relative overflow-hidden bg-gradient-to-br ${grad} ${className}`}>
      <div className="absolute inset-0 opacity-20" style={{ backgroundImage: "radial-gradient(circle at 30% 20%, white 0%, transparent 45%)" }} />
      <div className="absolute -right-4 -bottom-4 opacity-25">
        <Icon className="w-28 h-28" strokeWidth={1.2} />
      </div>
      <div className="absolute top-2 left-2">
        <Icon className="w-5 h-5 text-white/90" />
      </div>
    </div>
  );
}

export function StarRow({ rating, size = "w-3.5 h-3.5" }) {
  return (
    <div className="flex items-center gap-0.5 text-amber-400">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star key={n} className={size} fill={n <= Math.round(rating) ? "currentColor" : "none"} strokeWidth={1.5} />
      ))}
    </div>
  );
}
