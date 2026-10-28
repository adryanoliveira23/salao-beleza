"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Scissors, ArrowRight, Search, Sparkles, Home } from "lucide-react";
import { soundEffects } from "@/lib/soundEffects";
import Link from "next/link";

export default function AgendarIndexPage() {
  const [slug, setSlug] = useState("");
  const router = useRouter();

  const handleGo = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = slug.trim().toLowerCase().replace(/^@/, "");
    if (!clean) return;
    soundEffects.playClick();
    router.push(`/agendamento/${clean}`);
  };

  return (
    <div className="min-h-screen bg-[var(--background)] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Glow Orbs Decorativos de Fundo */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-gradient-to-br from-[var(--primary)]/15 to-transparent rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-gradient-to-tl from-[var(--accent-gold)]/10 to-transparent rounded-full blur-3xl pointer-events-none" />

      <div className="bg-[var(--surface)] rounded-3xl shadow-2xl p-6 sm:p-8 max-w-md w-full text-center border border-[var(--card-border)] relative z-10">
        <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-[var(--primary)] to-[var(--primary-dark)] text-white flex items-center justify-center mx-auto mb-4 shadow-lg ring-4 ring-[var(--primary)]/15">
          <Scissors size={28} />
        </div>

        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--primary-light)]/50 text-[var(--primary)] text-xs font-bold mb-2">
          <Sparkles size={13} /> Agendamento BellaMais
        </span>

        <h1 className="text-2xl sm:text-3xl font-bold font-serif text-[var(--foreground)] mb-2">
          Agendamento Online
        </h1>
        <p className="text-xs sm:text-sm text-[var(--muted)] mb-6 leading-relaxed">
          Digite o nome de usuário do salão ou profissional para ver horários disponíveis e reservar em tempo real:
        </p>

        <form onSubmit={handleGo} className="space-y-3.5">
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-[var(--primary)] font-mono">
              @
            </span>
            <input
              type="text"
              required
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="ex: bellamais"
              className="w-full py-3.5 pl-8 pr-4 rounded-xl border border-[var(--card-border)] bg-[var(--background)] text-xs sm:text-sm text-[var(--foreground)] outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/20 transition font-mono"
            />
          </div>

          <button
            type="submit"
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[var(--primary)] to-[var(--primary-dark)] hover:opacity-95 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg transition active:scale-[0.99]"
          >
            Acessar Agenda do Salão <ArrowRight size={16} />
          </button>
        </form>

        <div className="mt-6 pt-5 border-t border-[var(--card-border)]">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--muted)] hover:text-[var(--foreground)] transition"
          >
            <Home size={14} /> Voltar para o início
          </Link>
        </div>
      </div>
    </div>
  );
}
