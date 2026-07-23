"use client";

import { useState } from "react";
import Link from "next/link";
import { Glass } from "../../components/ui";
import { createClient } from "../../lib/supabase/client";

export default function ForgotPasswordPage() {
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const email = new FormData(e.target).get("email");

    const supabase = createClient();
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    setLoading(false);
    if (resetError) {
      setError(resetError.message);
      return;
    }
    setSent(true);
  }

  return (
    <div className="max-w-sm mx-auto px-4 py-16">
      <Glass className="rounded-3xl p-6">
        <h1 className="font-display text-lg mb-6">Recuperar senha</h1>
        {sent ? (
          <p className="text-sm text-white/60">Se existir uma conta com esse e-mail, enviamos um link para redefinir sua senha.</p>
        ) : (
          <>
            {error && <p className="text-sm text-red-300 bg-red-400/10 border border-red-400/30 rounded-xl px-3 py-2 mb-4">{error}</p>}
            <form onSubmit={handleSubmit} className="space-y-3">
              <input name="email" required type="email" placeholder="Seu e-mail" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm placeholder:text-white/30 focus:outline-none focus:border-cyan-400/50" />
              <button disabled={loading} type="submit" className="w-full py-3 rounded-full font-semibold bg-gradient-to-r from-[#3D5CFF] to-[#9333EA] disabled:opacity-50">
                {loading ? "Enviando..." : "Enviar link de recuperação"}
              </button>
            </form>
          </>
        )}
        <p className="text-center text-xs text-white/40 mt-5">
          <Link href="/login" className="text-cyan-300 font-semibold">Voltar ao login</Link>
        </p>
      </Glass>
    </div>
  );
}
