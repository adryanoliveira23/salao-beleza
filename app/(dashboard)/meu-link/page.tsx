"use client";

import React, { useState } from "react";
import {
  Link2,
  Copy,
  Check,
  ExternalLink,
  AlertCircle,
  ArrowRight,
} from "lucide-react";
import { Header } from "@/components/Header";
import { useAuth } from "@/contexts/AuthContext";
import Link from "next/link";

export default function MeuLinkPage() {
  const [copied, setCopied] = useState(false);
  const { profile } = useAuth();

  // Clean username logic
  const username = profile?.username;
  const isConfigured = !!username;

  const bookingUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/agendar/${username || ""}`
      : `/agendar/${username || ""}`;

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(bookingUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const input = document.createElement("input");
      input.value = bookingUrl;
      document.body.appendChild(input);
      input.select();
      document.execCommand("copy");
      document.body.removeChild(input);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const openLink = () => {
    window.open(bookingUrl, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="flex flex-col h-full bg-[#f5f5f5]">
      <Header title="Link de Agendamento" />

      <div className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-10">
        <div className="max-w-[640px] mx-auto">
          <div className="bg-white rounded-[16px] md:rounded-[20px] shadow-[0_4px_20px_rgba(0,0,0,0.06)] border border-[#FF6B9D]/10 overflow-hidden p-6 md:p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-xl bg-linear-to-br from-[#FF6B9D] to-[#C73866] flex items-center justify-center text-white">
                <Link2 size={24} />
              </div>
              <div>
                <h2 className="text-xl font-bold font-serif text-[#2d1b2e]">
                  Compartilhe seu link
                </h2>
                <p className="text-sm text-[#666]">
                  Envie para suas clientes agendarem online
                </p>
              </div>
            </div>

            {!isConfigured ? (
              <div className="bg-orange-50 border border-orange-200 rounded-xl p-6 text-center">
                <AlertCircle
                  size={48}
                  className="text-orange-500 mx-auto mb-4"
                />
                <h3 className="text-lg font-bold text-orange-800 mb-2">
                  Você precisa criar um @usuario
                </h3>
                <p className="text-orange-700 mb-6">
                  Para gerar seu link de agendamento personalizado, você precisa
                  definir um nome de usuário nas configurações.
                </p>
                <Link
                  href="/configuracoes"
                  className="inline-flex items-center gap-2 bg-orange-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-orange-700 transition-colors"
                >
                  Criar meu @usuario agora <ArrowRight size={18} />
                </Link>
              </div>
            ) : (
              <>
                <p className="text-[#666] mb-6">
                  Compartilhe este link com suas clientes para que elas agendem
                  online. Os agendamentos aparecerão automaticamente na sua
                  agenda.
                </p>

                <div className="flex flex-col gap-4">
                  <div className="flex flex-col sm:flex-row gap-3">
                    <input
                      type="text"
                      readOnly
                      value={bookingUrl}
                      className="flex-1 p-3 border-2 border-[#f0f0f0] rounded-xl text-sm bg-[#fafafa] font-mono text-gray-600"
                    />
                    <button
                      type="button"
                      onClick={copyLink}
                      className="flex items-center justify-center gap-2 bg-linear-to-br from-[#FF6B9D] to-[#C73866] text-white px-6 py-3 rounded-xl font-semibold shadow-lg hover:-translate-y-0.5 transition-all shrink-0 active:scale-95"
                    >
                      {copied ? (
                        <>
                          <Check size={18} />
                          Copiado!
                        </>
                      ) : (
                        <>
                          <Copy size={18} />
                          Copiar
                        </>
                      )}
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={openLink}
                    className="flex items-center justify-center gap-2 w-full py-3 rounded-xl font-semibold border-2 border-[#FF6B9D] text-[#FF6B9D] hover:bg-[#FF6B9D]/5 transition-all"
                  >
                    <ExternalLink size={18} />
                    Testar meu link
                  </button>
                </div>

                <p className="text-xs text-[#999] mt-6 text-center">
                  Seu link é único:{" "}
                  <strong>AGENDLY.COM/AGENDAR/{username?.toUpperCase()}</strong>
                </p>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
