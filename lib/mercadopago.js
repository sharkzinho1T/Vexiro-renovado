// Integração real com a API do Mercado Pago para cobranças PIX.
// Requer a variável de ambiente MERCADOPAGO_ACCESS_TOKEN (obtida no painel de
// desenvolvedores do Mercado Pago: https://www.mercadopago.com.br/developers).
// Sem essa variável configurada, o checkout roda em modo de simulação (ver checkout/route).

const MP_BASE = "https://api.mercadopago.com";

export async function createPixPayment({ amount, description, payerEmail, externalReference }) {
  const token = process.env.MERCADOPAGO_ACCESS_TOKEN;
  if (!token) {
    return { simulated: true };
  }

  const res = await fetch(`${MP_BASE}/v1/payments`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      "X-Idempotency-Key": externalReference,
    },
    body: JSON.stringify({
      transaction_amount: Number(amount),
      description,
      payment_method_id: "pix",
      payer: { email: payerEmail },
      external_reference: externalReference,
      notification_url: process.env.MERCADOPAGO_WEBHOOK_URL,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Falha ao criar cobrança PIX: ${err}`);
  }

  const data = await res.json();
  return {
    simulated: false,
    providerId: String(data.id),
    status: data.status, // pending, approved, rejected
    qrCodeBase64: data.point_of_interaction?.transaction_data?.qr_code_base64,
    copyPaste: data.point_of_interaction?.transaction_data?.qr_code,
  };
}

export async function getPaymentStatus(paymentId) {
  const token = process.env.MERCADOPAGO_ACCESS_TOKEN;
  if (!token) return { simulated: true, status: "approved" };

  const res = await fetch(`${MP_BASE}/v1/payments/${paymentId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("Falha ao consultar pagamento");
  const data = await res.json();
  return { simulated: false, status: data.status };
}
