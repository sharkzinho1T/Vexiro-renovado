"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { QrCode, Copy, CheckCircle2, Loader2, ArrowLeft, Tag } from "lucide-react";
import { Glass, money } from "../../components/ui";
import { useCart } from "../../components/CartContext";
import { useToast } from "../../components/Toast";

export default function CheckoutPage() {
  const { cart, total, clearCart } = useCart();
  const router = useRouter();
  const toast = useToast();

  const [step, setStep] = useState("review"); // review | pix | processing | success
  const [order, setOrder] = useState(null);
  const [payment, setPayment] = useState(null);
  const [couponCode, setCouponCode] = useState("");
  const [couponApplied, setCouponApplied] = useState(null);
  const [copyOk, setCopyOk] = useState(false);
  const [loading, setLoading] = useState(false);

  async function applyCoupon() {
    if (!couponCode) return;
    const res = await fetch("/api/coupons/validate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: couponCode }),
    });
    const data = await res.json();
    if (data.valid) {
      setCouponApplied(data);
      toast(`Cupom aplicado: -${data.percentOff}%`, "success");
    } else {
      toast("Cupom inválido ou expirado.", "error");
    }
  }

  async function createOrder() {
    if (cart.length === 0) return;
    setLoading(true);
    const res = await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        items: cart.map((i) => ({ productId: i.productId, quantity: i.quantity })),
        couponCode: couponApplied ? couponCode : undefined,
      }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      toast(data.error || "Erro ao criar pedido.", "error");
      return;
    }
    setOrder(data.order);
    setPayment(data.payment);
    setStep("pix");
  }

  function copyCode() {
    navigator.clipboard?.writeText(payment.pixCopyPaste || "");
    setCopyOk(true);
    setTimeout(() => setCopyOk(false), 2000);
  }

  async function confirmPayment() {
    setStep("processing");
    const res = await fetch(`/api/orders/${order.id}/confirm`, { method: "POST" });
    const data = await res.json();
    if (!res.ok || (data.status && data.status !== "approved" && data.order === undefined)) {
      toast(data.message || data.error || "Pagamento ainda não confirmado. Tente novamente em instantes.", "error");
      setStep("pix");
      return;
    }
    clearCart();
    setStep("success");
  }

  const discounted = couponApplied ? total * (1 - couponApplied.percentOff / 100) : total;

  if (cart.length === 0 && step === "review") {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center text-white/50">
        Seu carrinho está vazio. <button onClick={() => router.push("/")} className="text-cyan-300">Voltar ao catálogo</button>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto px-4 py-14">
      <Glass className="rounded-3xl p-6">
        {step === "review" && (
          <>
            <h1 className="font-display text-lg mb-5">Revisar pedido</h1>
            <div className="space-y-3 max-h-60 overflow-y-auto mb-4">
              {cart.map((i) => (
                <div key={i.productId} className="flex justify-between text-sm">
                  <span className="text-white/70 line-clamp-1 pr-2">{i.quantity}x {i.title}</span>
                  <span className="shrink-0">{money(i.price * i.quantity)}</span>
                </div>
              ))}
            </div>

            <div className="flex gap-2 mb-4">
              <div className="relative flex-1">
                <Tag className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
                <input
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value)}
                  placeholder="Cupom de desconto"
                  className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-3 py-2 text-sm placeholder:text-white/30 focus:outline-none focus:border-cyan-400/50"
                />
              </div>
              <button onClick={applyCoupon} className="px-4 py-2 rounded-xl text-sm border border-white/15 hover:bg-white/5">Aplicar</button>
            </div>

            <div className="flex justify-between font-display text-lg border-t border-white/10 pt-4 mb-6">
              <span>Total</span>
              <span>{money(discounted)}</span>
            </div>
            <button disabled={loading} onClick={createOrder} className="w-full py-3 rounded-full font-semibold bg-gradient-to-r from-[#3D5CFF] to-[#9333EA] flex items-center justify-center gap-2 disabled:opacity-50">
              <QrCode className="w-4 h-4" /> {loading ? "Gerando cobrança..." : "Pagar com PIX"}
            </button>
          </>
        )}

        {step === "pix" && payment && (
          <>
            <div className="flex items-center gap-2 mb-5">
              <button onClick={() => setStep("review")}><ArrowLeft className="w-5 h-5" /></button>
              <h1 className="font-display text-lg">Pagamento via PIX</h1>
            </div>
            <div className="bg-white rounded-2xl p-4 w-40 h-40 mx-auto mb-5 flex items-center justify-center overflow-hidden">
              {payment.pixQrCode ? (
                <img src={`data:image/png;base64,${payment.pixQrCode}`} alt="QR Code PIX" className="w-full h-full object-contain" />
              ) : (
                <QrCode className="w-28 h-28 text-black" strokeWidth={1} />
              )}
            </div>
            <p className="text-center text-white/50 text-xs mb-4">Escaneie o QR Code ou copie o código abaixo no app do seu banco</p>
            <div className="bg-white/5 border border-white/10 rounded-xl p-3 flex items-center gap-2 mb-2">
              <p className="text-[10px] text-white/50 truncate flex-1">{payment.pixCopyPaste}</p>
              <button onClick={copyCode} className="shrink-0 text-cyan-300"><Copy className="w-4 h-4" /></button>
            </div>
            {copyOk && <p className="text-xs text-cyan-300 text-center mb-3">Código copiado!</p>}
            <p className="text-center font-display text-xl mb-5">{money(Number(payment.amount))}</p>
            <button onClick={confirmPayment} className="w-full py-3 rounded-full font-semibold bg-gradient-to-r from-[#3D5CFF] to-[#9333EA]">
              Já paguei
            </button>
            <p className="text-center text-[10px] text-white/30 mt-3">
              Sem chave do Mercado Pago configurada no servidor, este é um ambiente de simulação — clicar em "Já paguei" aprova o pedido automaticamente para fins de teste.
            </p>
          </>
        )}

        {step === "processing" && (
          <div className="py-10 flex flex-col items-center gap-4">
            <Loader2 className="w-10 h-10 text-cyan-300 animate-spin" />
            <p className="text-white/60 text-sm">Confirmando pagamento...</p>
          </div>
        )}

        {step === "success" && (
          <div className="py-6 flex flex-col items-center text-center gap-3">
            <div className="w-16 h-16 rounded-full bg-cyan-400/10 border border-cyan-400/30 flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8 text-cyan-300" />
            </div>
            <h1 className="font-display text-lg">Pagamento confirmado!</h1>
            <p className="text-white/50 text-sm max-w-xs">Seus produtos foram entregues digitalmente e já estão no seu histórico de compras. Vortex Points creditados.</p>
            <button onClick={() => router.push("/profile?tab=compras")} className="mt-3 px-6 py-2.5 rounded-full font-semibold bg-gradient-to-r from-[#3D5CFF] to-[#9333EA]">
              Ver minhas compras
            </button>
          </div>
        )}
      </Glass>
    </div>
  );
}
