"use client";

import { CartProvider } from "./CartContext";
import { ToastProvider } from "./Toast";

export default function Providers({ children }) {
  return (
    <ToastProvider>
      <CartProvider>{children}</CartProvider>
    </ToastProvider>
  );
}
