"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { ClipboardList, Heart, Wallet, Bell, LogOut, Store } from "lucide-react";
import { Glass, ProductCover, money } from "../../components/ui";

function ProfileInner() {
  const { data: session } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [tab, setTab] = useState(searchParams.get("tab") || "compras");

  const [orders, setOrders] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [wallet, setWallet] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [applying, setApplying] = useState(false);

  useEffect(() => {
    if (!session?.user) return;
    fetch("/api/orders").then((r) => r.json()).then((d) => setOrders(d.orders || []));
    fetch("/api/favorites").then((r) => r.json()).then((d) => setFavorites(d.favorites || []));
    fetch("/api/wallet").then((r) => r.json()).then((d) => setWallet(d));
    fetch("/api/notifications").then((r) => r.json()).then((d) => setNotifications(d.notifications || []));
  }, [session?.user, tab]);

  async function markAllRead() {
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ markAll: true }),
    });
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }

  async function becomeSeller() {
    setApplying(true);
    await fetch("/api/seller/apply", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sellerName: session.user.name }),
    });
    setApplying(false);
    router.push("/seller");
    router.refresh();
  }

  if (!session?.user) {
    return (
      <div className="max-w-sm mx-auto px-4 py-20 text-center">
        <p className="text-white/50 mb-4">Entre na sua conta para ver seu perfil.</p>
        <Link href="/login" className="px-6 py-3 rounded-full font-semibold bg-gradient-to-r from-[#3D5CFF] to-[#9333EA]">Entrar</Link>
      </div>
    );
  }

  const tabs = [
    { id: "compras", label: "Compras", icon: ClipboardList },
    { id: "favoritos", label: "Favoritos", icon: Heart },
    { id: "carteira", label: "Carteira", icon: Wallet },
    { id: "notificacoes", label: "Notificações", icon: Bell },
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
      <div className="flex items-center gap-4 mb-8 flex-wrap">
        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-cyan-400 to-[#3D5CFF] flex items-center justify-center font-display text-xl">
          {session.user.name?.[0]?.toUpperCase()}
        </div>
        <div>
          <h1 className="font-display text-xl">{session.user.name}</h1>
          <p className="text-white/40 text-sm">{session.user.email}</p>
        </div>
        <div className="ml-auto flex gap-2">
          {["SELLER", "ADMIN"].includes(session.user.role) ? (
            <Link href="/seller" className="px-4 py-2 rounded-full text-sm font-semibold border border-white/15 hover:bg-white/5 flex items-center gap-2">
              <Store className="w-4 h-4" /> Painel do vendedor
            </Link>
          ) : (
            <button disabled={applying} onClick={becomeSeller} className="px-4 py-2 rounded-full text-sm font-semibold bg-gradient-to-r from-[#3D5CFF] to-[#9333EA]">
              {applying ? "Enviando..." : "Tornar-se vendedor"}
            </button>
          )}
          <button onClick={() => signOut({ callbackUrl: "/" })} className="p-2.5 rounded-full border border-white/15 hover:bg-white/5"><LogOut className="w-4 h-4" /></button>
        </div>
      </div>

      <div className="flex gap-2 border-b border-white/10 mb-6 overflow-x-auto">
        {tabs.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)} className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition whitespace-nowrap ${tab === t.id ? "border-cyan-400 text-white" : "border-transparent text-white/40 hover:text-white/70"}`}>
            <t.icon className="w-4 h-4" /> {t.label}
          </button>
        ))}
      </div>

      {tab === "compras" && (
        orders.length === 0 ? <p className="text-white/40 text-sm">Você ainda não fez nenhuma compra.</p> : (
          <div className="space-y-4">
            {orders.map((o) => (
              <Glass key={o.id} className="rounded-2xl p-5">
                <div className="flex justify-between mb-3 text-sm flex-wrap gap-2">
                  <span className="text-white/40">Pedido #{o.id.slice(-8)} — {new Date(o.createdAt).toLocaleDateString("pt-BR")}</span>
                  <span className={`text-xs px-2 py-1 rounded-full ${o.status === "DELIVERED" ? "bg-cyan-400/10 text-cyan-300" : "bg-amber-400/10 text-amber-300"}`}>{o.status}</span>
                </div>
                {o.items.map((i) => (
                  <div key={i.id} className="flex justify-between text-sm text-white/60 py-1">
                    <span>{i.quantity}x {i.title}</span>
                    <span>{money(i.unitPrice * i.quantity)}</span>
                  </div>
                ))}
                <div className="flex justify-between text-sm font-semibold mt-2 pt-2 border-t border-white/10">
                  <span>Total</span><span>{money(o.total)}</span>
                </div>
              </Glass>
            ))}
          </div>
        )
      )}

      {tab === "favoritos" && (
        favorites.length === 0 ? <p className="text-white/40 text-sm">Nenhum produto favoritado ainda.</p> : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {favorites.map((f) => (
              <Link key={f.id} href={`/product/${f.product.id}`}>
                <Glass className="rounded-2xl overflow-hidden hover:border-cyan-400/30 transition">
                  <ProductCover categorySlug={f.product.category?.slug} className="h-28 w-full" />
                  <div className="p-4">
                    <p className="text-sm font-semibold line-clamp-1">{f.product.title}</p>
                    <p className="text-white/40 text-xs mt-1">{money(f.product.price)}</p>
                  </div>
                </Glass>
              </Link>
            ))}
          </div>
        )
      )}

      {tab === "carteira" && wallet && (
        <div className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <Glass className="rounded-2xl p-5"><p className="text-xs text-white/40">Saldo em carteira</p><p className="font-display text-xl">{money(wallet.wallet.balance)}</p></Glass>
            <Glass className="rounded-2xl p-5"><p className="text-xs text-white/40">Vortex Points</p><p className="font-display text-xl">{wallet.vortexPoints} pts</p></Glass>
          </div>
          <Glass className="rounded-2xl overflow-hidden">
            <div className="p-4 border-b border-white/10 text-sm font-semibold">Histórico</div>
            {wallet.wallet.transactions.length === 0 ? (
              <p className="p-5 text-white/40 text-sm">Nenhuma movimentação ainda.</p>
            ) : (
              wallet.wallet.transactions.map((t) => (
                <div key={t.id} className="flex justify-between px-5 py-3 text-sm border-t border-white/5 first:border-t-0">
                  <span className="text-white/60 capitalize">{t.type}</span>
                  <span className={Number(t.amount) >= 0 ? "text-cyan-300" : "text-red-300"}>{money(t.amount)}</span>
                </div>
              ))
            )}
          </Glass>
        </div>
      )}

      {tab === "notificacoes" && (
        <div>
          {notifications.some((n) => !n.read) && (
            <button onClick={markAllRead} className="text-xs text-cyan-300 mb-4">Marcar todas como lidas</button>
          )}
          <div className="space-y-2">
            {notifications.length === 0 && <p className="text-white/40 text-sm">Sem notificações.</p>}
            {notifications.map((n) => (
              <Glass key={n.id} className={`rounded-xl p-4 ${!n.read ? "border-cyan-400/30" : ""}`}>
                <p className="text-sm font-semibold">{n.title}</p>
                <p className="text-xs text-white/50 mt-1">{n.message}</p>
                <p className="text-[10px] text-white/30 mt-2">{new Date(n.createdAt).toLocaleString("pt-BR")}</p>
              </Glass>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function ProfilePage() {
  return (
    <Suspense fallback={<div className="max-w-5xl mx-auto px-6 py-20 text-white/40">Carregando...</div>}>
      <ProfileInner />
    </Suspense>
  );
}
