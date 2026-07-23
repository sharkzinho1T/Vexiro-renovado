"use client";

import { useEffect, useState } from "react";
import { useUser } from "../../hooks/useUser";
import Link from "next/link";
import { Package, Plus, Trash2, DollarSign, TrendingUp, BarChart3, X } from "lucide-react";
import { Glass, money } from "../../components/ui";
import { useToast } from "../../components/Toast";

const CATEGORIES = [
  { slug: "freefire", name: "Free Fire" },
  { slug: "roblox", name: "Roblox" },
  { slug: "minecraft", name: "Minecraft" },
  { slug: "fortnite", name: "Fortnite" },
  { slug: "valorant", name: "Valorant" },
  { slug: "outros", name: "Outros Jogos" },
];

export default function SellerPage() {
  const { user, loading: userLoading } = useUser();
  const toast = useToast();

  const [products, setProducts] = useState([]);
  const [earnings, setEarnings] = useState(0);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", price: "", stock: "", categorySlug: "freefire" });
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [withdrawForm, setWithdrawForm] = useState({ amount: "", pixKey: "" });

  async function load() {
    const res = await fetch("/api/seller/products");
    if (res.ok) {
      const data = await res.json();
      setProducts(data.products);
      setEarnings(data.earnings);
    }
  }

  useEffect(() => {
    if (user) load();
  }, [user]);

  async function applyToSell() {
    await fetch("/api/seller/apply", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sellerName: user.name }),
    });
    toast("Solicitação enviada! Aguarde a aprovação do administrador.", "success");
    window.location.reload();
  }

  async function submitProduct(e) {
    e.preventDefault();
    const res = await fetch("/api/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: form.title,
        description: form.description,
        price: parseFloat(form.price),
        stock: parseInt(form.stock),
        categorySlug: form.categorySlug,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      toast(data.error, "error");
      return;
    }
    toast("Produto publicado!", "success");
    setShowAdd(false);
    setForm({ title: "", description: "", price: "", stock: "", categorySlug: "freefire" });
    load();
  }

  async function removeProduct(id) {
    const res = await fetch(`/api/products/${id}`, { method: "DELETE" });
    if (res.ok) {
      toast("Produto removido.", "success");
      load();
    }
  }

  async function submitWithdraw(e) {
    e.preventDefault();
    const res = await fetch("/api/seller/withdraw", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount: parseFloat(withdrawForm.amount), pixKey: withdrawForm.pixKey }),
    });
    const data = await res.json();
    if (!res.ok) {
      toast(data.error, "error");
      return;
    }
    toast("Saque solicitado! Está em análise.", "success");
    setShowWithdraw(false);
    setWithdrawForm({ amount: "", pixKey: "" });
  }

  if (userLoading) return null;

  if (!user) {
    return (
      <div className="max-w-lg mx-auto px-4 py-24 text-center">
        <Package className="w-10 h-10 text-cyan-300 mx-auto mb-4" />
        <h1 className="font-display text-xl mb-2">Área do vendedor</h1>
        <p className="text-white/50 text-sm mb-6">Entre na sua conta para acessar o painel de vendedor.</p>
        <Link href="/login" className="px-6 py-3 rounded-full font-semibold bg-gradient-to-r from-[#3D5CFF] to-[#9333EA]">Entrar</Link>
      </div>
    );
  }

  if (!["SELLER", "ADMIN"].includes(user.role)) {
    return (
      <div className="max-w-lg mx-auto px-4 py-24 text-center">
        <Package className="w-10 h-10 text-cyan-300 mx-auto mb-4" />
        <h1 className="font-display text-xl mb-2">Torne-se um vendedor Vexiro</h1>
        <p className="text-white/50 text-sm mb-6">Solicite sua conta de vendedor. Após aprovação do administrador, você poderá anunciar produtos e, com verificação, ganhar o selo de Vendedor Verificado.</p>
        <button onClick={applyToSell} className="px-6 py-3 rounded-full font-semibold bg-gradient-to-r from-[#3D5CFF] to-[#9333EA]">Solicitar conta de vendedor</button>
      </div>
    );
  }

  if (user.sellerStatus === "PENDING") {
    return (
      <div className="max-w-lg mx-auto px-4 py-24 text-center">
        <Package className="w-10 h-10 text-amber-300 mx-auto mb-4" />
        <h1 className="font-display text-xl mb-2">Solicitação em análise</h1>
        <p className="text-white/50 text-sm">Sua conta de vendedor está aguardando aprovação do administrador. Você será notificado assim que for aprovada.</p>
      </div>
    );
  }

  const totalStock = products.reduce((s, p) => s + p.stock, 0);
  const totalSold = products.reduce((s, p) => s + p.sold, 0);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
      <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
        <div>
          <h1 className="font-display text-xl flex items-center gap-2"><Package className="w-5 h-5 text-cyan-300" /> Painel do vendedor</h1>
          <p className="text-white/40 text-sm mt-1">
            {user.sellerStatus === "VERIFIED" ? "Vendedor verificado ✓" : "Verificação pendente"}
          </p>
        </div>
        <button onClick={() => setShowAdd(true)} className="px-5 py-2.5 rounded-full text-sm font-semibold bg-gradient-to-r from-[#3D5CFF] to-[#9333EA] flex items-center gap-2">
          <Plus className="w-4 h-4" /> Adicionar produto
        </button>
      </div>

      <div className="grid sm:grid-cols-4 gap-4 mb-8">
        <Glass className="rounded-2xl p-5"><DollarSign className="w-5 h-5 text-cyan-300 mb-2" /><p className="text-xs text-white/40">Ganhos totais</p><p className="font-display text-lg">{money(earnings)}</p></Glass>
        <Glass className="rounded-2xl p-5"><Package className="w-5 h-5 text-cyan-300 mb-2" /><p className="text-xs text-white/40">Produtos ativos</p><p className="font-display text-lg">{products.length}</p></Glass>
        <Glass className="rounded-2xl p-5"><TrendingUp className="w-5 h-5 text-cyan-300 mb-2" /><p className="text-xs text-white/40">Itens vendidos</p><p className="font-display text-lg">{totalSold}</p></Glass>
        <Glass className="rounded-2xl p-5"><BarChart3 className="w-5 h-5 text-cyan-300 mb-2" /><p className="text-xs text-white/40">Estoque total</p><p className="font-display text-lg">{totalStock}</p></Glass>
      </div>

      <Glass className="rounded-2xl overflow-hidden mb-8">
        <div className="p-5 border-b border-white/10 font-semibold">Meus produtos</div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-white/40 text-xs">
                <th className="px-5 py-3 font-medium">Produto</th>
                <th className="px-5 py-3 font-medium">Categoria</th>
                <th className="px-5 py-3 font-medium">Preço</th>
                <th className="px-5 py-3 font-medium">Estoque</th>
                <th className="px-5 py-3 font-medium">Vendidos</th>
                <th className="px-5 py-3 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id} className="border-t border-white/5">
                  <td className="px-5 py-3">{p.title}</td>
                  <td className="px-5 py-3 text-white/50">{p.category?.name}</td>
                  <td className="px-5 py-3">{money(p.price)}</td>
                  <td className="px-5 py-3">{p.stock}</td>
                  <td className="px-5 py-3">{p.sold}</td>
                  <td className="px-5 py-3 text-right">
                    <button onClick={() => removeProduct(p.id)} className="text-white/30 hover:text-red-400"><Trash2 className="w-4 h-4" /></button>
                  </td>
                </tr>
              ))}
              {products.length === 0 && (
                <tr><td colSpan={6} className="px-5 py-8 text-center text-white/40">Nenhum produto cadastrado ainda.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Glass>

      <Glass className="rounded-2xl p-6 flex items-center justify-between flex-wrap gap-4">
        <div>
          <h3 className="font-semibold mb-1">Saldo disponível para saque</h3>
          <p className="text-white/40 text-sm">Solicite a transferência dos seus ganhos para sua chave PIX.</p>
        </div>
        <button onClick={() => setShowWithdraw(true)} className="px-5 py-2.5 rounded-full text-sm font-semibold bg-gradient-to-r from-[#3D5CFF] to-[#9333EA]">Solicitar saque</button>
      </Glass>

      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={() => setShowAdd(false)}>
          <Glass className="rounded-3xl max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-display text-lg">Novo produto</h3>
              <button onClick={() => setShowAdd(false)}><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={submitProduct} className="space-y-3">
              <input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Nome do produto" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm placeholder:text-white/30 focus:outline-none focus:border-cyan-400/50" />
              <textarea required value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Descrição completa" rows={3} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm placeholder:text-white/30 focus:outline-none focus:border-cyan-400/50" />
              <select value={form.categorySlug} onChange={(e) => setForm({ ...form, categorySlug: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-cyan-400/50">
                {CATEGORIES.map((c) => <option key={c.slug} value={c.slug} className="bg-[#0a0a1a]">{c.name}</option>)}
              </select>
              <div className="flex gap-3">
                <input required type="number" step="0.01" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} placeholder="Preço (R$)" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm placeholder:text-white/30 focus:outline-none focus:border-cyan-400/50" />
                <input required type="number" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} placeholder="Estoque" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm placeholder:text-white/30 focus:outline-none focus:border-cyan-400/50" />
              </div>
              <button type="submit" className="w-full py-3 rounded-full font-semibold bg-gradient-to-r from-[#3D5CFF] to-[#9333EA] mt-2">Publicar produto</button>
            </form>
          </Glass>
        </div>
      )}

      {showWithdraw && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={() => setShowWithdraw(false)}>
          <Glass className="rounded-3xl max-w-sm w-full p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-display text-lg">Solicitar saque</h3>
              <button onClick={() => setShowWithdraw(false)}><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={submitWithdraw} className="space-y-3">
              <input required type="number" step="0.01" value={withdrawForm.amount} onChange={(e) => setWithdrawForm({ ...withdrawForm, amount: e.target.value })} placeholder="Valor (R$)" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm placeholder:text-white/30 focus:outline-none focus:border-cyan-400/50" />
              <input required value={withdrawForm.pixKey} onChange={(e) => setWithdrawForm({ ...withdrawForm, pixKey: e.target.value })} placeholder="Sua chave PIX" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm placeholder:text-white/30 focus:outline-none focus:border-cyan-400/50" />
              <button type="submit" className="w-full py-3 rounded-full font-semibold bg-gradient-to-r from-[#3D5CFF] to-[#9333EA] mt-2">Confirmar solicitação</button>
            </form>
          </Glass>
        </div>
      )}
    </div>
  );
}
