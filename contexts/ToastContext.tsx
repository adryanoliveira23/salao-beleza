"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from "lucide-react";
import { soundEffects } from "@/lib/soundEffects";

export type ToastType = "success" | "error" | "info" | "warning";

export interface ToastItem {
  id: string;
  message: string;
  type: ToastType;
  title?: string;
}

interface ToastContextType {
  toast: (message: string, type?: ToastType, title?: string) => void;
  success: (message: string, title?: string) => void;
  error: (message: string, title?: string) => void;
  info: (message: string, title?: string) => void;
  warning: (message: string, title?: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback(
    (message: string, type: ToastType = "info", title?: string) => {
      const id = Math.random().toString(36).substring(2, 9);

      if (type === "success") {
        soundEffects.playSuccess();
      } else {
        soundEffects.playPop();
      }

      setToasts((prev) => [...prev, { id, message, type, title }]);

      setTimeout(() => {
        removeToast(id);
      }, 4000);
    },
    [removeToast]
  );

  const success = useCallback(
    (msg: string, title?: string) => addToast(msg, "success", title),
    [addToast]
  );
  const error = useCallback(
    (msg: string, title?: string) => addToast(msg, "error", title),
    [addToast]
  );
  const info = useCallback(
    (msg: string, title?: string) => addToast(msg, "info", title),
    [addToast]
  );
  const warning = useCallback(
    (msg: string, title?: string) => addToast(msg, "warning", title),
    [addToast]
  );

  return (
    <ToastContext.Provider value={{ toast: addToast, success, error, info, warning }}>
      {children}

      {/* Modern, Floating Toast Container - Bottom Right (No annoying top window dialogs) */}
      <div
        aria-live="polite"
        className="fixed bottom-5 right-5 z-[9999] flex flex-col gap-2.5 max-w-sm w-full pointer-events-none px-4 sm:px-0"
      >
        {toasts.map((t) => {
          const isSuccess = t.type === "success";
          const isError = t.type === "error";
          const isWarning = t.type === "warning";

          return (
            <div
              key={t.id}
              role="status"
              className={`pointer-events-auto flex items-start gap-3 p-4 rounded-2xl shadow-xl border backdrop-blur-md transition-all duration-300 animate-in fade-in slide-in-from-bottom-4 ${
                isSuccess
                  ? "bg-white/95 dark:bg-zinc-900/95 border-emerald-500/40 text-zinc-900 dark:text-zinc-100 shadow-emerald-500/10"
                  : isError
                  ? "bg-white/95 dark:bg-zinc-900/95 border-rose-500/40 text-zinc-900 dark:text-zinc-100 shadow-rose-500/10"
                  : isWarning
                  ? "bg-white/95 dark:bg-zinc-900/95 border-amber-500/40 text-zinc-900 dark:text-zinc-100 shadow-amber-500/10"
                  : "bg-white/95 dark:bg-zinc-900/95 border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 shadow-zinc-500/10"
              }`}
            >
              <div className="shrink-0 mt-0.5">
                {isSuccess && <CheckCircle2 size={18} className="text-emerald-500" />}
                {isError && <AlertCircle size={18} className="text-rose-500" />}
                {isWarning && <AlertTriangle size={18} className="text-amber-500" />}
                {!isSuccess && !isError && !isWarning && (
                  <Info size={18} className="text-rose-500" />
                )}
              </div>

              <div className="flex-1 min-w-0">
                {t.title && (
                  <p className="text-xs font-bold mb-0.5 text-[var(--foreground)]">
                    {t.title}
                  </p>
                )}
                <p className="text-xs leading-relaxed text-[var(--foreground)] font-medium">
                  {t.message}
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  soundEffects.playClick();
                  removeToast(t.id);
                }}
                className="shrink-0 p-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 text-[var(--muted)] hover:text-[var(--foreground)] transition-colors cursor-pointer"
                aria-label="Fechar notificação"
              >
                <X size={14} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}
