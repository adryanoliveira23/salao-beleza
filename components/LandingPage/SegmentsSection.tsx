"use client";

import React from "react";
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
    icon: <Scissors size={28} />,
    title: "Salões de Beleza",
    desc: "Cabelo, química, cronograma capilar e gestão de equipe.",
    color: "from-pink-500 to-rose-500",
  },
  {
    icon: <Feather size={28} />,
    title: "Barbearias",
    desc: "Agilidade no agendamento, planos de assinatura e comandas.",
    color: "from-blue-600 to-cyan-600",
  },
  {
    icon: <Sparkles size={28} />,
    title: "Esmalterias",
    desc: "Controle de serviços rápidos, combos e fidelidade.",
    color: "from-purple-500 to-indigo-500",
  },
  {
    icon: <Smile size={28} />,
    title: "Clínicas de Estética",
    desc: "Anamnese, pacotes de sessões e histórico de procedimentos.",
    color: "from-emerald-500 to-teal-500",
  },
  {
    icon: <Palette size={28} />,
    title: "Maquiadores",
    desc: "Portfólio online, reservas para eventos e noivas.",
    color: "from-amber-500 to-orange-500",
  },
  {
    icon: <Briefcase size={28} />,
    title: "Profissionais Autônomos",
    desc: "Agenda pessoal, link de bio e controle financeiro simples.",
    color: "from-slate-600 to-slate-800",
  },
];

export function SegmentsSection() {
  return (
    <section className="py-12 md:py-20 bg-[#fcfcfc]">
      <div className="max-w-7xl mx-auto px-4 md:px-6">
        <div className="text-center mb-8 md:mb-14">
          <span className="inline-block py-1 px-3 rounded-full bg-[#FF6B9D]/10 text-[#FF6B9D] font-semibold text-xs sm:text-sm mb-3">
            Para Todos os Tamanhos
          </span>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-[#2d1b2e] mb-3 md:mb-5 font-sans tracking-tight text-balance">
            Feito sob medida para o seu negócio
          </h2>
          <p className="text-sm sm:text-base text-[#666] max-w-2xl mx-auto text-balance">
            Não importa se você tem uma equipe completa ou trabalha sozinho(a), o
            BellaMais se adapta à sua rotina diária.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {segments.map((segment, index) => (
            <div
              key={index}
              className="bg-white p-5 sm:p-6 md:p-8 rounded-2xl border border-[#f0f0f0] shadow-2xs hover:shadow-md transition-all hover:-translate-y-1 group"
            >
              <div
                className={`w-12 h-12 md:w-14 md:h-14 rounded-xl bg-gradient-to-br ${segment.color} flex items-center justify-center text-white mb-4 md:mb-5 group-hover:scale-105 transition-transform shadow-xs`}
              >
                {segment.icon}
              </div>
              <h3 className="text-base sm:text-lg md:text-xl font-bold text-[#2d1b2e] mb-1.5 md:mb-2">
                {segment.title}
              </h3>
              <p className="text-xs sm:text-sm text-[#666] leading-relaxed">{segment.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
