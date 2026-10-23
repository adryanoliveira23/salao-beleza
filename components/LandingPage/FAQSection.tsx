"use client";

import React, { useState } from "react";
import { ChevronDown, ChevronUp, HelpCircle } from "lucide-react";

const faqs = [
  {
    question: "Preciso instalar algum programa no computador?",
    answer:
      "Não! O BellaMais é 100% online. Você pode acessar de qualquer celular, tablet ou computador diretamente pelo navegador, sem precisar baixar nada.",
  },
  {
    question: "Posso testar antes de assinar?",
    answer:
      "Sim, você tem 7 dias de teste grátis sem precisar cadastrar cartão de crédito. É só criar a sua conta e começar a usar na hora.",
  },
  {
    question: "O sistema envia lembretes automáticos no WhatsApp?",
    answer:
      "Sim! O sistema envia lembretes de confirmação 24h antes diretamente no WhatsApp da cliente, reduzindo faltas e atrasos em até 80%.",
  },
  {
    question: "Serve para barbearias, esmalterias ou clínicas de estética?",
    answer:
      "Com certeza! O BellaMais atende salões de beleza, barbearias, esmalterias, esteticistas, manicures, maquiadoras e profissionais autônomas.",
  },
  {
    question: "É seguro colocar os dados dos meus clientes?",
    answer:
      "Sim, total segurança. Os dados ficam salvos em nuvem com criptografia de ponta a ponta e backups diários, em total conformidade com a LGPD.",
  },
  {
    question: "Como funciona o suporte se eu tiver dúvidas?",
    answer:
      "Nosso suporte é direto pelo WhatsApp e chat interno. Se precisar de ajuda para configurar seus serviços ou comissões, nosso time te orienta passo a passo.",
  },
];

export function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section className="py-12 md:py-20 bg-white" id="faq">
      <div className="max-w-4xl mx-auto px-4 md:px-6">
        <div className="text-center mb-8 md:mb-14">
          <span className="inline-block py-1 px-3 rounded-full bg-[#FF6B9D]/10 text-[#FF6B9D] font-semibold text-xs sm:text-sm mb-3">
            Tira-Dúvidas
          </span>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-[#2d1b2e] mb-3 md:mb-5 font-sans tracking-tight text-balance">
            Perguntas Frequentes
          </h2>
          <p className="text-sm sm:text-base text-[#666] max-w-2xl mx-auto text-balance">
            Separamos as dúvidas mais comuns de donas de salão e profissionais da beleza para você começar com segurança.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:gap-4">
          {faqs.map((faq, index) => (
            <div
              key={index}
              className={`border rounded-2xl transition-all duration-300 ${
                openIndex === index
                  ? "border-[var(--primary)]/30 bg-[var(--primary)]/5 shadow-2xs"
                  : "border-[#f0f0f0] bg-white hover:border-[var(--primary)]/20"
              }`}
            >
              <button
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                className="w-full text-left p-4 sm:p-5 md:p-6 flex items-start justify-between gap-3 sm:gap-4 cursor-pointer"
              >
                <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                  <HelpCircle
                    size={18}
                    className={`shrink-0 ${
                      openIndex === index ? "text-[var(--primary)]" : "text-[#aaa]"
                    }`}
                  />
                  <span
                    className={`font-semibold text-sm sm:text-base md:text-lg leading-snug ${
                      openIndex === index ? "text-[#2d1b2e]" : "text-[#555]"
                    }`}
                  >
                    {faq.question}
                  </span>
                </div>
                {openIndex === index ? (
                  <ChevronUp className="text-[var(--primary)] shrink-0 mt-0.5" size={18} />
                ) : (
                  <ChevronDown className="text-[#aaa] shrink-0 mt-0.5" size={18} />
                )}
              </button>
              <div
                className={`overflow-hidden transition-all duration-300 ease-in-out ${
                  openIndex === index
                    ? "max-h-60 opacity-100"
                    : "max-h-0 opacity-0"
                }`}
              >
                <div className="p-4 sm:p-5 md:p-6 pt-0 text-xs sm:text-sm text-[#666] leading-relaxed pl-9 sm:pl-11 md:pl-14 pr-4">
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
