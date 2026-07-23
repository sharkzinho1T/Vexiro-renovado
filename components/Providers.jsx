"use client";

import { SessionProvider } from "next-auth/react";
import { CartProvider } from "./CartContext";
import { ToastProvider } from "./Toast";

export default function Providers({ children }) {
  return (
    <SessionProvider>
      <ToastProvider>
        <CartProvider>{children}</CartProvider>
      </ToastProvider>
    </SessionProvider>
  );
}
