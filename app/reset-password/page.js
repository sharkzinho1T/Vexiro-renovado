"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Glass } from "../../components/ui";
import { createClient } from "../../lib/supabase/client";

// O link do e-mail de recuperação traz uma sessão temporária (Supabase já
// autentica o usuário automaticamente ao clicar no link). Esta página só
// precisa pedir a nova senha e chamar updateUser.
export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    if (password.length < 8) {
      setError("A senha precisa ter pelo menos 8 caracteres.");
      return;
    }
    setLoading(true);
    const supabase = createClient();
    const { error: updateError } = await supabase.auth.updateUser({ password });
    setLoading(false);

    if (updateError) {
      setError(updateError.message);
      return;
    }
    setDone(true);
    setTimeout(() => router.push("/login"), 2000);
  }

  return (
    <div className="max-w-sm mx-auto px-4 py-16">
      <Glass className="rounded-3xl p-6">
        <h1 className="font-display text-lg mb-6">Definir nova senha</h1>
        {done ? (
          <p className="text-sm text-cyan-300">Senha atualizada! Redirecionando para o login...</p>
        ) : (
          <>
            {error && <p className="text-sm text-red-300 bg-red-400/10 border border-red-400/30 rounded-xl px-3 py-2 mb-4">{error}</p>}
            <form onSubmit={handleSubmit} className="space-y-3">
              <input
                required
                minLength={8}
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Nova senha (mín. 8 caracteres)"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm placeholder:text-white/30 focus:outline-none focus:border-cyan-400/50"
              />
              <button disabled={loading} type="submit" className="w-full py-3 rounded-full font-semibold bg-gradient-to-r from-[#3D5CFF] to-[#9333EA] disabled:opacity-50">
                {loading ? "Salvando..." : "Salvar nova senha"}
              </button>
            </form>
          </>
        )}
      </Glass>
    </div>
  );
}
