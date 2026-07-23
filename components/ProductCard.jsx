"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { Heart, BadgeCheck } from "lucide-react";
import { Glass, ProductCover, StarRow, money } from "./ui";
import { useCart } from "./CartContext";
import { useToast } from "./Toast";

export default function ProductCard({ product, isFavorite = false, onToggleFavorite }) {
  const { addToCart } = useCart();
  const { data: session } = useSession();
  const toast = useToast();

  function handleAdd(e) {
    e.preventDefault();
    e.stopPropagation();
    addToCart(product);
    toast("Adicionado ao carrinho", "success");
  }

  function handleFav(e) {
    e.preventDefault();
    e.stopPropagation();
    if (!session?.user) {
      toast("Entre na sua conta para favoritar produtos", "info");
      return;
    }
    onToggleFavorite?.(product.id);
  }

  const finalPrice = Number(product.price) * (1 - (product.discount || 0) / 100);

  return (
    <Glass className="rounded-2xl overflow-hidden group hover:border-cyan-400/30 transition flex flex-col">
      <Link href={`/product/${product.id}`} className="text-left flex-1 flex flex-col">
        <div className="relative">
          <ProductCover categorySlug={product.category?.slug} className="h-36 w-full" />
          <button onClick={handleFav} className="absolute top-2 right-2 p-1.5 rounded-full bg-black/40 backdrop-blur-sm hover:bg-black/60">
            <Heart className={`w-4 h-4 ${isFavorite ? "text-pink-400" : "text-white/70"}`} fill={isFavorite ? "currentColor" : "none"} />
          </button>
          {product.discount > 0 && (
            <span className="absolute top-2 left-2 text-[10px] font-bold bg-cyan-400 text-black px-2 py-0.5 rounded-full">
              -{product.discount}%
            </span>
          )}
        </div>
        <div className="p-4 flex-1 flex flex-col">
          <p className="text-[11px] text-cyan-300/80 font-semibold mb-1">{product.category?.name}</p>
          <p className="text-sm font-semibold text-white leading-snug line-clamp-2 min-h-[2.5rem]">{product.title}</p>
          <div className="flex items-center gap-1.5 mt-2">
            <StarRow rating={product.avgRating || 0} />
            <span className="text-[11px] text-white/40">({product.reviewCount ?? product.sold ?? 0})</span>
          </div>
          <div className="flex items-center gap-1 mt-1.5">
            <p className="text-[11px] text-white/40">{product.seller?.sellerName || product.seller?.name}</p>
            {product.seller?.sellerStatus === "VERIFIED" && <BadgeCheck className="w-3 h-3 text-cyan-300" />}
          </div>
          <div className="mt-auto pt-3">
            <p className="font-display text-white text-lg">{money(finalPrice)}</p>
            <p className="text-[10px] text-white/30">{product.stock} em estoque</p>
          </div>
        </div>
      </Link>
      <button onClick={handleAdd} disabled={product.stock === 0} className="m-3 mt-0 py-2 rounded-xl text-sm font-semibold bg-gradient-to-r from-[#3D5CFF] to-[#9333EA] hover:shadow-[0_0_20px_rgba(61,92,255,0.4)] transition disabled:opacity-40 disabled:cursor-not-allowed">
        {product.stock === 0 ? "Esgotado" : "Comprar"}
      </button>
    </Glass>
  );
}
