"use client";

import { createContext, useCallback, useContext, useState } from "react";
import { CheckCircle2, XCircle, Info } from "lucide-react";

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const push = useCallback((message, variant = "info") => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, variant }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4000);
  }, []);

  return (
    <ToastContext.Provider value={push}>
      {children}
      <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 max-w-sm">
        {toasts.map((t) => (
          <div
            key={t.id}
            className="bg-[#0a0a1a]/95 backdrop-blur-xl border border-white/10 rounded-xl px-4 py-3 flex items-center gap-2 text-sm shadow-2xl animate-in fade-in slide-in-from-bottom-2"
          >
            {t.variant === "success" && <CheckCircle2 className="w-4 h-4 text-cyan-300 shrink-0" />}
            {t.variant === "error" && <XCircle className="w-4 h-4 text-red-400 shrink-0" />}
            {t.variant === "info" && <Info className="w-4 h-4 text-cyan-300 shrink-0" />}
            <span className="text-white/90">{t.message}</span>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast precisa estar dentro de <ToastProvider>");
  return ctx;
}
