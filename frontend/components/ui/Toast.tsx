"use client";

import { createContext, useCallback, useContext, useState } from "react";
import { clsx } from "@/lib/clsx";

type Toast = { id: number; message: string; tone: "success" | "error" | "info" };

const ToastContext = createContext<(message: string, tone?: Toast["tone"]) => void>(
  () => {}
);

export const useToast = () => useContext(ToastContext);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const push = useCallback((message: string, tone: Toast["tone"] = "info") => {
    const id = Date.now() + Math.random();
    setToasts((current) => [...current, { id, message, tone }]);
    setTimeout(() => setToasts((c) => c.filter((t) => t.id !== id)), 3200);
  }, []);

  return (
    <ToastContext.Provider value={push}>
      {children}
      <div
        className="pointer-events-none fixed inset-x-0 top-4 z-50 flex flex-col items-center gap-2 px-4"
        role="status"
        aria-live="polite"
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={clsx(
              "animate-pop-in rounded-2xl border-2 border-b-4 px-5 py-3 text-[15px] font-bold shadow-sm",
              toast.tone === "success" && "border-leaf-dark bg-correct-bg text-correct-text",
              toast.tone === "error" && "border-coral-dark bg-incorrect-bg text-incorrect-text",
              toast.tone === "info" && "border-cloud bg-white text-ink"
            )}
          >
            {toast.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
