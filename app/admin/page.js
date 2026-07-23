"use client";

import { useEffect, useState } from "react";
import { useUser } from "../../hooks/useUser";
import Link from "next/link";
import { Users, ShieldCheck, Package, BarChart3, AlertTriangle, Settings, DollarSign, BadgeCheck } from "lucide-react";
import { Glass, money } from "../../components/ui";
import { useToast } from "../../components/Toast";

export default function AdminPage() {
  const { user, loading: userLoading } = useUser();
  const toast = useToast();
  const [tab, setTab] = useState("dashboard");

  const [dashboard, setDashboard] = useState(null);
  const [users, setUsers] = useState([]);
  const [sellers, setSellers] = useState([]);
  const [reports, setReports] = useState([]);
  const [coupons, setCoupons] = useState([]);
  const [couponForm, setCouponForm] = useState({ code: "", percentOff: "" });

  async function loadAll() {
    const [d, u, s, r, c] = await Promise.all([
      fetch("/api/admin/dashboard").then((r) => r.json()),
      fetch("/api/admin/users").then((r) => r.json()),
      fetch("/api/admin/sellers").then((r) => r.json()),
      fetch("/api/admin/reports").then((r) => r.json()),
      fetch("/api/admin/coupons").then((r) => r.json()),
    ]);
    setDashboard(d);
    setUsers(u.users || []);
    setSellers(s.sellers || []);
    setReports(r.reports || []);
    setCoupons(c.coupons || []);
  }

  useEffect(() => {
    if (user?.role === "ADMIN") loadAll();
  }, [user]);

  async function toggleSuspend(u) {
    await fetch(`/api/admin/users/${u.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ suspended: !u.suspended }),
    });
    loadAll();
  }

  async function approveSeller(id, status) {
    await fetch(`/api/admin/sellers/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    toast(status === "VERIFIED" ? "Selo de verificado concedido." : "Status atualizado.", "success");
    loadAll();
  }

  async function resolveReport(id) {
    await fetch(`/api/admin/reports/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "RESOLVED" }),
    });
    loadAll();
  }

  async function createCoupon(e) {
    e.preventDefault();
    const res = await fetch("/api/admin/coupons", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: couponForm.code, percentOff: parseInt(couponForm.percentOff) }),
    });
    const data = await res.json();
    if (!res.ok) {
      toast(data.error, "error");
      return;
    }
    toast("Cupom criado!", "success");
    setCouponForm({ code: "", percentOff: "" });
    loadAll();
  }

  if (userLoading) return null;

  if (!user || user.role !== "ADMIN") {
    return (
      <div className="max-w-lg mx-auto px-4 py-24 text-center">
        <Settings className="w-10 h-10 text-cyan-300 mx-auto mb-4" />
        <h1 className="font-display text-xl mb-2">Área administrativa</h1>
        <p className="text-white/50 text-sm mb-6">Acesso restrito a administradores da Vexiro.</p>
        <Link href="/" className="text-cyan-300 text-sm">Voltar ao início</Link>
      </div>
    );
  }

  const tabs = [
    { id: "dashboard", label: "Dashboard", icon: BarChart3 },
    { id: "usuarios", label: "Usuários", icon: Users },
    { id: "vendedores", label: "Vendedores", icon: ShieldCheck },
    { id: "denuncias", label: "Denúncias", icon: AlertTriangle },
    { id: "cupons", label: "Cupons", icon: DollarSign },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
      <div className="flex items-center gap-2 mb-8">
        <Settings className="w-5 h-5 text-cyan-300" />
        <h1 className="font-display text-xl">Painel administrativo</h1>
      </div>

      <div className="flex gap-2 border-b border-white/10 mb-6 overflow-x-auto">
        {tabs.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)} className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition whitespace-nowrap ${tab === t.id ? "border-cyan-400 text-white" : "border-transparent text-white/40 hover:text-white/70"}`}>
            <t.icon className="w-4 h-4" /> {t.label}
          </button>
        ))}
      </div>

      {tab === "dashboard" && dashboard && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <Glass className="rounded-2xl p-5"><Users className="w-5 h-5 text-cyan-300 mb-2" /><p className="text-xs text-white/40">Usuários</p><p className="font-display text-lg">{dashboard.userCount}</p></Glass>
          <Glass className="rounded-2xl p-5"><ShieldCheck className="w-5 h-5 text-cyan-300 mb-2" /><p className="text-xs text-white/40">Vendedores</p><p className="font-display text-lg">{dashboard.sellerCount}</p></Glass>
          <Glass className="rounded-2xl p-5"><Package className="w-5 h-5 text-cyan-300 mb-2" /><p className="text-xs text-white/40">Produtos ativos</p><p className="font-display text-lg">{dashboard.productCount}</p></Glass>
          <Glass className="rounded-2xl p-5"><DollarSign className="w-5 h-5 text-cyan-300 mb-2" /><p className="text-xs text-white/40">Volume vendido</p><p className="font-display text-lg">{money(dashboard.totalVolume)}</p></Glass>
          <Glass className="rounded-2xl p-5"><AlertTriangle className="w-5 h-5 text-cyan-300 mb-2" /><p className="text-xs text-white/40">Denúncias abertas</p><p className="font-display text-lg">{dashboard.openReports}</p></Glass>
        </div>
      )}

      {tab === "usuarios" && (
        <Glass className="rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
            <thead><tr className="text-left text-white/40 text-xs"><th className="px-5 py-3">Usuário</th><th className="px-5 py-3">E-mail</th><th className="px-5 py-3">Cargo</th><th className="px-5 py-3">Status</th><th className="px-5 py-3"></th></tr></thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-t border-white/5">
                  <td className="px-5 py-3">{u.name}</td>
                  <td className="px-5 py-3 text-white/50">{u.email}</td>
                  <td className="px-5 py-3 text-white/50">{u.role}</td>
                  <td className="px-5 py-3">
                    <span className={`text-xs px-2 py-1 rounded-full ${!u.suspended ? "bg-cyan-400/10 text-cyan-300" : "bg-red-400/10 text-red-300"}`}>{u.suspended ? "Suspenso" : "Ativo"}</span>
                  </td>
                  <td className="px-5 py-3 text-right">
                    <button onClick={() => toggleSuspend(u)} className="text-xs text-white/50 hover:text-white">{u.suspended ? "Reativar" : "Suspender"}</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Glass>
      )}

      {tab === "vendedores" && (
        <div className="space-y-3">
          {sellers.length === 0 && <p className="text-white/40 text-sm">Nenhum vendedor cadastrado.</p>}
          {sellers.map((s) => (
            <Glass key={s.id} className="rounded-2xl p-5 flex items-center justify-between flex-wrap gap-3">
              <div>
                <p className="font-semibold flex items-center gap-1.5">{s.sellerName || s.name} {s.sellerStatus === "VERIFIED" && <BadgeCheck className="w-4 h-4 text-cyan-300" />}</p>
                <p className="text-xs text-white/40">{s.email} · status: {s.sellerStatus}</p>
              </div>
              <div className="flex gap-2">
                {s.sellerStatus !== "VERIFIED" && (
                  <button onClick={() => approveSeller(s.id, "VERIFIED")} className="px-4 py-2 rounded-full text-sm font-semibold bg-gradient-to-r from-[#3D5CFF] to-[#9333EA] flex items-center gap-2">
                    <BadgeCheck className="w-4 h-4" /> Aprovar selo
                  </button>
                )}
                {s.sellerStatus !== "SUSPENDED" && (
                  <button onClick={() => approveSeller(s.id, "SUSPENDED")} className="px-4 py-2 rounded-full text-sm border border-white/15 hover:bg-white/5">Suspender</button>
                )}
              </div>
            </Glass>
          ))}
        </div>
      )}

      {tab === "denuncias" && (
        <div className="space-y-3">
          {reports.length === 0 && <p className="text-white/40 text-sm">Nenhuma denúncia em aberto.</p>}
          {reports.map((r) => (
            <Glass key={r.id} className="rounded-2xl p-5 flex items-center justify-between flex-wrap gap-3">
              <div>
                <p className="font-semibold text-sm">{r.targetType} · {r.targetId.slice(-8)}</p>
                <p className="text-xs text-white/40">Motivo: {r.reason} — por {r.reporter.name}</p>
              </div>
              <button onClick={() => resolveReport(r.id)} className="px-4 py-2 rounded-full text-sm border border-white/15 hover:bg-white/5">Marcar como resolvida</button>
            </Glass>
          ))}
        </div>
      )}

      {tab === "cupons" && (
        <div>
          <Glass className="rounded-2xl p-5 mb-6">
            <form onSubmit={createCoupon} className="flex gap-3 flex-wrap items-end">
              <div>
                <label className="text-xs text-white/40 block mb-1">Código</label>
                <input required value={couponForm.code} onChange={(e) => setCouponForm({ ...couponForm, code: e.target.value })} className="bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm" placeholder="VEXIRO10" />
              </div>
              <div>
                <label className="text-xs text-white/40 block mb-1">Desconto (%)</label>
                <input required type="number" min="1" max="90" value={couponForm.percentOff} onChange={(e) => setCouponForm({ ...couponForm, percentOff: e.target.value })} className="bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm w-24" />
              </div>
              <button type="submit" className="px-5 py-2.5 rounded-full text-sm font-semibold bg-gradient-to-r from-[#3D5CFF] to-[#9333EA]">Criar cupom</button>
            </form>
          </Glass>
          <div className="grid sm:grid-cols-3 gap-3">
            {coupons.map((c) => (
              <Glass key={c.id} className="rounded-xl p-4">
                <p className="font-display text-sm">{c.code}</p>
                <p className="text-xs text-white/40">-{c.percentOff}% · usado {c.usedCount}x</p>
              </Glass>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
