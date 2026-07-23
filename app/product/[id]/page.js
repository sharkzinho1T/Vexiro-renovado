"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useUser } from "../../../hooks/useUser";
import { Heart, ShoppingCart, MessageCircle, X } from "lucide-react";
import { Glass, ProductCover, StarRow, VerifiedBadge, money } from "../../../components/ui";
import { useCart } from "../../../components/CartContext";
import { useToast } from "../../../components/Toast";

export default function ProductPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user } = useUser();
  const { addToCart } = useCart();
  const toast = useToast();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isFavorite, setIsFavorite] = useState(false);
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: "" });
  const [submittingReview, setSubmittingReview] = useState(false);

  useEffect(() => {
    fetch(`/api/products/${id}`)
      .then((r) => r.json())
      .then((data) => setProduct(data.product))
      .finally(() => setLoading(false));

    if (user) {
      fetch("/api/favorites")
        .then((r) => r.json())
        .then((data) => setIsFavorite((data.favorites || []).some((f) => f.productId === id)));
    }
  }, [id, user]);

  async function toggleFav() {
    if (!user) {
      toast("Entre na sua conta para favoritar produtos", "info");
      return;
    }
    const res = await fetch("/api/favorites", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId: id }),
    });
    const data = await res.json();
    setIsFavorite(data.favorited);
  }

  async function startChat() {
    if (!user) {
      router.push("/login");
      return;
    }
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sellerId: product.sellerId, productId: product.id }),
    });
    const data = await res.json();
    if (res.ok) router.push(`/chat?c=${data.conversation.id}`);
  }

  async function submitReview(e) {
    e.preventDefault();
    setSubmittingReview(true);
    const res = await fetch("/api/reviews", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId: id, ...reviewForm }),
    });
    const data = await res.json();
    setSubmittingReview(false);
    if (!res.ok) {
      toast(data.error, "error");
      return;
    }
    toast("Avaliação enviada!", "success");
    setReviewForm({ rating: 5, comment: "" });
    const refreshed = await fetch(`/api/products/${id}`).then((r) => r.json());
    setProduct(refreshed.product);
  }

  if (loading) return <div className="max-w-3xl mx-auto px-4 py-20 text-white/40 text-center">Carregando produto...</div>;
  if (!product) return <div className="max-w-3xl mx-auto px-4 py-20 text-white/40 text-center">Produto não encontrado.</div>;

  const finalPrice = Number(product.price) * (1 - (product.discount || 0) / 100);

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
      <ProductCover categorySlug={product.category?.slug} className="h-56 w-full rounded-3xl mb-6" />

      <p className="text-xs text-cyan-300 font-semibold mb-1">{product.category?.name}</p>
      <div className="flex items-start justify-between gap-4">
        <h1 className="font-display text-2xl text-white">{product.title}</h1>
        <button onClick={toggleFav} className="shrink-0 p-2 rounded-full border border-white/10 hover:border-pink-400/40">
          <Heart className={`w-5 h-5 ${isFavorite ? "text-pink-400" : "text-white/60"}`} fill={isFavorite ? "currentColor" : "none"} />
        </button>
      </div>

      <div className="flex items-center gap-3 mt-3 flex-wrap">
        <StarRow rating={product.avgRating} />
        <span className="text-xs text-white/40">{product.reviews.length} avaliações · {product.sold} vendas</span>
        <span className="text-xs text-white/40">· {product.stock} em estoque</span>
      </div>

      <div className="flex items-center gap-2 mt-3">
        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[#3D5CFF] to-[#9333EA] text-[10px] flex items-center justify-center font-bold">
          {(product.seller.sellerName || product.seller.name)[0]}
        </div>
        <span className="text-sm text-white/70">{product.seller.sellerName || product.seller.name}</span>
        {product.seller.sellerStatus === "VERIFIED" && <VerifiedBadge />}
        <button onClick={startChat} className="ml-auto flex items-center gap-1.5 text-xs text-cyan-300 hover:text-cyan-200">
          <MessageCircle className="w-4 h-4" /> Conversar com o vendedor
        </button>
      </div>

      <p className="text-sm text-white/60 leading-relaxed mt-5 whitespace-pre-line">{product.description}</p>

      <Glass className="rounded-2xl p-5 mt-6 flex items-center justify-between flex-wrap gap-4">
        <div>
          {product.discount > 0 && <p className="text-xs text-white/40 line-through">{money(product.price)}</p>}
          <p className="font-display text-2xl text-white">{money(finalPrice)}</p>
        </div>
        <button
          onClick={() => { addToCart(product); toast("Adicionado ao carrinho", "success"); }}
          disabled={product.stock === 0}
          className="px-6 py-3 rounded-full font-semibold bg-gradient-to-r from-[#3D5CFF] to-[#9333EA] hover:shadow-[0_0_20px_rgba(147,51,234,0.5)] transition flex items-center gap-2 disabled:opacity-40"
        >
          <ShoppingCart className="w-4 h-4" /> {product.stock === 0 ? "Esgotado" : "Adicionar ao carrinho"}
        </button>
      </Glass>

      <section className="mt-10">
        <h2 className="font-display text-lg mb-4">Avaliações</h2>

        {user && (
          <Glass className="rounded-2xl p-4 mb-5">
            <form onSubmit={submitReview} className="space-y-3">
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button key={n} type="button" onClick={() => setReviewForm((f) => ({ ...f, rating: n }))}>
                    <StarRow rating={n <= reviewForm.rating ? 5 : 0} size="w-5 h-5" />
                  </button>
                ))}
              </div>
              <textarea
                required
                value={reviewForm.comment}
                onChange={(e) => setReviewForm((f) => ({ ...f, comment: e.target.value }))}
                placeholder="Conte como foi sua experiência com este produto (disponível para quem já comprou)"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm placeholder:text-white/30 focus:outline-none focus:border-cyan-400/50"
                rows={3}
              />
              <button disabled={submittingReview} className="px-5 py-2 rounded-full text-sm font-semibold bg-gradient-to-r from-[#3D5CFF] to-[#9333EA] disabled:opacity-50">
                Enviar avaliação
              </button>
            </form>
          </Glass>
        )}

        <div className="space-y-3">
          {product.reviews.length === 0 && <p className="text-white/40 text-sm">Ainda não há avaliações para este produto.</p>}
          {product.reviews.map((r) => (
            <Glass key={r.id} className="rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-1.5">
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-cyan-400 to-[#3D5CFF] text-[10px] flex items-center justify-center font-bold">{r.user.name[0]}</div>
                <span className="text-sm font-semibold">{r.user.name}</span>
                <StarRow rating={r.rating} />
              </div>
              <p className="text-sm text-white/60">{r.comment}</p>
            </Glass>
          ))}
        </div>
      </section>
    </div>
  );
}
