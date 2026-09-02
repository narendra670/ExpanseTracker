"use client";

import { ToastProvider } from "@/components/Toast";

export default function AppGroupLayout({ children }) {
  return <ToastProvider>{children}</ToastProvider>;
}
