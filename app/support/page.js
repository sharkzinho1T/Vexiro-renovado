"use client";

import { Glass } from "../../components/ui";

const FAQS = [
  { q: "Como funciona a entrega dos produtos?", a: "Após a confirmação do pagamento via PIX, os produtos digitais são entregues automaticamente e ficam disponíveis no seu histórico de compras." },
  { q: "O que significa o selo Vendedor Verificado?", a: "Vendedores verificados passaram por análise da equipe Vexiro, garantindo mais segurança nas transações." },
  { q: "Posso pedir reembolso?", a: "Em caso de produto não entregue ou divergente da descrição, envie uma denúncia pelo chat com o vendedor. Nossa moderação analisa o caso." },
  { q: "Como faço para virar vendedor?", a: "Acesse o Painel do Vendedor no seu perfil, solicite sua conta de vendedor e aguarde a aprovação do administrador." },
];

export default function SupportPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-14">
      <h1 className="font-display text-2xl mb-2">Central de suporte</h1>
      <p className="text-white/50 text-sm mb-8">Tire suas dúvidas sobre compras, vendas e segurança na Vexiro.</p>
      <div className="space-y-3">
        {FAQS.map((f, i) => (
          <Glass key={i} className="rounded-2xl p-5">
            <p className="font-semibold text-sm mb-1.5">{f.q}</p>
            <p className="text-white/50 text-sm leading-relaxed">{f.a}</p>
          </Glass>
        ))}
      </div>
    </div>
  );
}
