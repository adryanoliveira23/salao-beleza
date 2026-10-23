"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Scissors, ArrowRight } from "lucide-react";

export default function AgendarIndexPage() {
  const [slug, setSlug] = useState("");
  const router = useRouter();

  const handleGo = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = slug.trim().toLowerCase().replace(/^@/, "");
    if (!clean) return;
    router.push(`/agendar/${clean}`);
  };

  return (
    <div className="min-h-screen bg-[#faf6f2] flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-xl p-8 max-w-md w-full text-center border border-[#f2e6ea]">
        <div className="w-14 h-14 rounded-2xl bg-linear-to-br from-[#b83b6b] to-[#88234b] text-white flex items-center justify-center mx-auto mb-4">
          <Scissors size={26} />
        </div>
        <h1 className="text-2xl font-bold font-serif text-[#2d1b2e] mb-2">
          Agendamento Online
        </h1>
        <p className="text-xs text-[#6e5a65] mb-6">
          Digite o @usuario do salão de beleza para acessar a agenda de horários
          em tempo real:
        </p>
        <form onSubmit={handleGo} className="space-y-3">
          <input
            type="text"
            required
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            placeholder="Ex: studioglow"
            className="w-full p-3.5 rounded-xl border border-[#f2e6ea] text-sm outline-none focus:border-[#b83b6b]"
          />
          <button
            type="submit"
            className="w-full py-3.5 rounded-xl bg-linear-to-r from-[#b83b6b] to-[#88234b] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md"
          >
            Acessar Agenda do Salão <ArrowRight size={16} />
          </button>
        </form>
      </div>
    </div>
  );
}
