"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff } from "lucide-react";
import { Glass } from "../../components/ui";
import { createClient } from "../../lib/supabase/client";

function LoginInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const form = new FormData(e.target);
    const supabase = createClient();

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: form.get("email"),
      password: form.get("password"),
    });

    setLoading(false);
    if (signInError) {
      setError(
        signInError.message === "Invalid login credentials"
          ? "E-mail ou senha incorretos."
          : signInError.message
      );
      return;
    }

    router.push(searchParams.get("next") || "/");
    router.refresh();
  }

  return (
    <div className="max-w-sm mx-auto px-4 py-16">
      <Glass className="rounded-3xl p-6">
        <h1 className="font-display text-lg mb-6">Entrar na Vexiro</h1>
        {error && <p className="text-sm text-red-300 bg-red-400/10 border border-red-400/30 rounded-xl px-3 py-2 mb-4">{error}</p>}
        <form onSubmit={handleSubmit} className="space-y-3">
          <input name="email" required type="email" placeholder="E-mail" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm placeholder:text-white/30 focus:outline-none focus:border-cyan-400/50" />
          <div className="relative">
            <input name="password" required type={showPass ? "text" : "password"} placeholder="Senha" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm placeholder:text-white/30 focus:outline-none focus:border-cyan-400/50 pr-10" />
            <button type="button" onClick={() => setShowPass((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40">
              {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          <div className="text-right">
            <Link href="/forgot-password" className="text-xs text-cyan-300">Esqueceu a senha?</Link>
          </div>
          <button disabled={loading} type="submit" className="w-full py-3 rounded-full font-semibold bg-gradient-to-r from-[#3D5CFF] to-[#9333EA] disabled:opacity-50">
            {loading ? "Entrando..." : "Entrar"}
          </button>
        </form>
        <p className="text-center text-xs text-white/40 mt-5">
          Ainda não tem conta? <Link href="/register" className="text-cyan-300 font-semibold">Cadastre-se</Link>
        </p>
      </Glass>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginInner />
    </Suspense>
  );
}
