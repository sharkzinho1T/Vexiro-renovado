"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useUser } from "../../hooks/useUser";
import { Minus, Plus, Trash2, ShoppingCart } from "lucide-react";
import { Glass, ProductCover, money } from "../../components/ui";
import { useCart } from "../../components/CartContext";

export default function CartPage() {
  const { cart, updateQty, removeFromCart, total } = useCart();
  const { user } = useUser();
  const router = useRouter();

  function goCheckout() {
    if (!user) {
      router.push("/login");
      return;
    }
    router.push("/checkout");
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
      <h1 className="font-display text-xl mb-6 flex items-center gap-2"><ShoppingCart className="w-5 h-5 text-cyan-300" /> Seu carrinho</h1>

      {cart.length === 0 ? (
        <Glass className="rounded-2xl p-10 text-center text-white/50">
          Seu carrinho está vazio. <Link href="/" className="text-cyan-300">Ver catálogo</Link>
        </Glass>
      ) : (
        <>
          <div className="space-y-4 mb-8">
            {cart.map((item) => (
              <Glass key={item.productId} className="rounded-2xl p-4 flex gap-4">
                <ProductCover categorySlug={item.categorySlug} className="w-20 h-20 rounded-xl shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold">{item.title}</p>
                  <p className="text-xs text-white/40 mt-1">{money(item.price)} cada</p>
                  <div className="flex items-center gap-2 mt-3">
                    <button onClick={() => updateQty(item.productId, -1)} className="w-7 h-7 rounded-full border border-white/15 flex items-center justify-center hover:bg-white/10"><Minus className="w-3.5 h-3.5" /></button>
                    <span className="text-sm w-5 text-center">{item.quantity}</span>
                    <button onClick={() => updateQty(item.productId, 1)} className="w-7 h-7 rounded-full border border-white/15 flex items-center justify-center hover:bg-white/10"><Plus className="w-3.5 h-3.5" /></button>
                    <button onClick={() => removeFromCart(item.productId)} className="ml-auto text-white/30 hover:text-red-400"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>
                <p className="font-display self-center">{money(item.price * item.quantity)}</p>
              </Glass>
            ))}
          </div>

          <Glass className="rounded-2xl p-5 flex items-center justify-between">
            <div>
              <p className="text-white/60 text-sm">Total</p>
              <p className="font-display text-2xl">{money(total)}</p>
            </div>
            <button onClick={goCheckout} className="px-6 py-3 rounded-full font-semibold bg-gradient-to-r from-[#3D5CFF] to-[#9333EA] hover:shadow-[0_0_20px_rgba(147,51,234,0.5)] transition">
              Finalizar compra
            </button>
          </Glass>
        </>
      )}
    </div>
  );
}
