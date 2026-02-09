"use client";

import React from "react";
import Image from "next/image"; // Using next/image this time to avoid linter warnings if possible, or simple img if user prefers setup avoid
// Actually, user context showed linter warnings for <img>. Let's use <img> for now to avoid 'Image' setup issues if next.config isn't ready for external domains,
// BUT we should adding comments or checking next.config.
// Given the speed requirement, I'll stick to <img> with the knowledge that it causes linter warnings, OR use a purely icon-based approach for safety.
// Let's use Icons + Gradients to correspond to the "Premium" feel without needing external assets that might break.
import {
  Scissors,
  Sparkles,
  Smile,
  Feather,
  Palette,
  Briefcase,
} from "lucide-react";

const segments = [
  {
    icon: <Scissors size={32} />,
    title: "Salões de Beleza",
    desc: "Cabelo, química, cronograma capilar e gestão de equipe.",
    color: "from-pink-500 to-rose-500",
  },
  {
    icon: <Feather size={32} />,
    title: "Barbearias",
    desc: "Agilidade no agendamento, planos de assinatura e comandas.",
    color: "from-blue-600 to-cyan-600",
  },
  {
    icon: <Sparkles size={32} />,
    title: "Esmalterias",
    desc: "Controle de serviços rápidos, combos e fidelidade.",
    color: "from-purple-500 to-indigo-500",
  },
  {
    icon: <Smile size={32} />,
    title: "Clínicas de Estética",
    desc: "Anamnese, pacotes de sessões e fotos de antes/depois.",
    color: "from-emerald-500 to-teal-500",
  },
  {
    icon: <Palette size={32} />,
    title: "Maquiadores",
    desc: "Portfólio online, reservas para eventos e noivas.",
    color: "from-amber-500 to-orange-500",
  },
  {
    icon: <Briefcase size={32} />,
    title: "Profissionais Autônomos",
    desc: "Agenda pessoal, link de bio e controle financeiro simples.",
    color: "from-slate-600 to-slate-800",
  },
];

export function SegmentsSection() {
  return (
    <section className="py-20 bg-[#fcfcfc]">
      <div className="max-w-7xl mx-auto px-4 md:px-6">
        <div className="text-center mb-16">
          <span className="inline-block py-1 px-3 rounded-full bg-[#FF6B9D]/10 text-[#FF6B9D] font-semibold text-sm mb-4">
            Para Todos os Tamanhos
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-[#2d1b2e] mb-6 font-serif">
            Feito sob medida para o seu negócio
          </h2>
          <p className="text-[#666] max-w-2xl mx-auto">
            Não importa se você é uma grande franquia ou trabalha sozinho(a), o
            Agendly Glow se adapta à sua rotina.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {segments.map((segment, index) => (
            <div
              key={index}
              className="bg-white p-8 rounded-2xl border border-[#f0f0f0] shadow-sm hover:shadow-lg transition-all hover:-translate-y-1 group"
            >
              <div
                className={`w-14 h-14 rounded-xl bg-linear-to-br ${segment.color} flex items-center justify-center text-white mb-6 group-hover:scale-110 transition-transform shadow-md`}
              >
                {segment.icon}
              </div>
              <h3 className="text-xl font-bold text-[#2d1b2e] mb-3">
                {segment.title}
              </h3>
              <p className="text-[#666] leading-relaxed">{segment.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
