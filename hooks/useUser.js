"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "../lib/supabase/client";

// Substitui o useSession() do NextAuth. Expõe { user, loading, refresh }.
// `user` traz { id, name, email, role, sellerStatus, avatarUrl } (mesmo
// formato usado nas rotas de API) ou null se não autenticado.
export function useUser() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadProfile = useCallback(async () => {
    try {
      const res = await fetch("/api/me");
      const data = await res.json();
      setUser(data.user);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const supabase = createClient();
    loadProfile();

    const { data: listener } = supabase.auth.onAuthStateChange(() => {
      loadProfile();
    });

    return () => listener.subscription.unsubscribe();
  }, [loadProfile]);

  return { user, loading, refresh: loadProfile };
}
