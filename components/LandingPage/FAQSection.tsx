"use client";

import React, { useState } from "react";
import { ChevronDown, ChevronUp, HelpCircle } from "lucide-react";

const faqs = [
  {
    question: "Preciso instalar algum programa no computador?",
    answer:
      "Não! O Agendly Glow é 100% online. Você pode acessar de qualquer lugar, seja pelo computador, tablet ou celular, sem precisar baixar nada.",
  },
  {
    question: "Posso testar antes de assinar?",
    answer:
      "Sim, você pode criar uma conta gratuita e explorar as funcionalidades. Oferecemos um período de demonstração para você ver na prática como seu salão pode crescer.",
  },
  {
    question: "O sistema envia lembretes automáticos?",
    answer:
      "Sim! O sistema envia lembretes via WhatsApp para seus clientes automaticamente, reduzindo drasticamente as faltas (no-show) e economizando o tempo da sua recepção.",
  },
  {
    question: "Serve para barbearias ou clínicas de estética?",
    answer:
      "Com certeza! O Agendly Glow é flexível e atende salões de beleza, barbearias, esmalterias, clínicas de estética, spas e profissionais autônomos.",
  },
  {
    question: "É seguro colocar os dados dos meus clientes?",
    answer:
      "Segurança é nossa prioridade. Seus dados são armazenados em servidores de última geração com criptografia de ponta a ponta e backups diários.",
  },
  {
    question: "Como funciona o suporte?",
    answer:
      "Temos uma equipe dedicada pronta para te ajudar via WhatsApp e chat online dentro da plataforma. Nunca te deixamos na mão!",
  },
];

export function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section className="py-20 bg-white" id="faq">
      <div className="max-w-4xl mx-auto px-4 md:px-6">
        <div className="text-center mb-16">
          <span className="inline-block py-1 px-3 rounded-full bg-[#FF6B9D]/10 text-[#FF6B9D] font-semibold text-sm mb-4">
            Tira-Dúvidas
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-[#2d1b2e] mb-6 font-serif">
            Perguntas Frequentes
          </h2>
          <p className="text-[#666] max-w-2xl mx-auto">
            Separamos as dúvidas mais comuns dos nossos parceiros para te ajudar
            a decidir com confiança.
          </p>
        </div>

        <div className="flex flex-col gap-4">
          {faqs.map((faq, index) => (
            <div
              key={index}
              className={`border rounded-2xl transition-all duration-300 ${
                openIndex === index
                  ? "border-[#FF6B9D]/30 bg-[#FF6B9D]/5 shadow-sm"
                  : "border-[#f0f0f0] bg-white hover:border-[#FF6B9D]/20"
              }`}
            >
              <button
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                className="w-full text-left p-5 md:p-6 flex items-start justify-between gap-4"
              >
                <div className="flex items-center gap-3">
                  <HelpCircle
                    size={20}
                    className={
                      openIndex === index ? "text-[#FF6B9D]" : "text-[#ccc]"
                    }
                  />
                  <span
                    className={`font-semibold text-lg ${
                      openIndex === index ? "text-[#2d1b2e]" : "text-[#666]"
                    }`}
                  >
                    {faq.question}
                  </span>
                </div>
                {openIndex === index ? (
                  <ChevronUp className="text-[#FF6B9D] shrink-0" />
                ) : (
                  <ChevronDown className="text-[#ccc] shrink-0" />
                )}
              </button>
              <div
                className={`overflow-hidden transition-all duration-300 ease-in-out ${
                  openIndex === index
                    ? "max-h-40 opacity-100"
                    : "max-h-0 opacity-0"
                }`}
              >
                <div className="p-6 pt-0 text-[#666] leading-relaxed pl-14">
                  {faq.answer}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
