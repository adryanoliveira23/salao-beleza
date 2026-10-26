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

  const username = profile?.username;
  const isConfigured = !!username;

  const bookingUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/agendamento/${username || ""}`
      : `/agendamento/${username || ""}`;

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
    <div className="flex flex-col h-full bg-[#f8f9fa] dark:bg-[#130f13]">
      <Header title="Link de Agendamento" />

      <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-10">
        <div className="max-w-[640px] mx-auto">
          <div className="bg-white dark:bg-[#1c151b] rounded-3xl shadow-sm border border-[var(--card-border)] overflow-hidden p-5 sm:p-6 md:p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[var(--primary)] to-[var(--primary-dark)] flex items-center justify-center text-white shadow-xs">
                <Link2 size={24} />
              </div>
              <div>
                <h2 className="text-xl font-bold font-sans tracking-tight text-[var(--foreground)]">
                  Compartilhe seu link
                </h2>
                <p className="text-xs sm:text-sm text-[var(--muted)]">
                  Envie para suas clientes agendarem online 24h
                </p>
              </div>
            </div>

            {!isConfigured ? (
              <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 rounded-2xl p-5 text-center">
                <AlertCircle
                  size={42}
                  className="text-amber-500 mx-auto mb-3"
                />
                <h3 className="text-base font-bold text-amber-900 dark:text-amber-200 mb-1.5">
                  Você precisa criar um @usuario
                </h3>
                <p className="text-xs text-amber-800 dark:text-amber-300 mb-4 max-w-sm mx-auto">
                  Para gerar seu link de agendamento personalizado, você precisa definir um nome de usuário nas configurações.
                </p>
                <Link
                  href="/configuracoes"
                  className="inline-flex items-center gap-2 bg-[var(--primary)] text-white px-5 py-2.5 rounded-xl font-bold text-xs hover:bg-[var(--primary-dark)] transition-colors shadow-xs"
                >
                  Criar meu @usuario agora <ArrowRight size={16} />
                </Link>
              </div>
            ) : (
              <>
                <p className="text-xs sm:text-sm text-[var(--muted)] mb-5 leading-relaxed">
                  Coloque este link na bio do seu Instagram ou envie no WhatsApp. As clientes escolhem o serviço e o horário sozinhas, caindo direto na sua agenda.
                </p>

                <div className="flex flex-col gap-3">
                  <div className="flex flex-col sm:flex-row gap-2.5">
                    <input
                      type="text"
                      readOnly
                      value={bookingUrl}
                      className="flex-1 p-3 border border-[var(--card-border)] rounded-xl text-xs sm:text-sm bg-[var(--background)] font-mono text-[var(--foreground)] outline-none"
                    />
                    <button
                      type="button"
                      onClick={copyLink}
                      className="flex items-center justify-center gap-2 bg-gradient-to-r from-[var(--primary)] to-[var(--primary-dark)] text-white px-5 py-3 rounded-xl font-bold text-xs shadow-xs hover:opacity-95 transition-all shrink-0 cursor-pointer"
                    >
                      {copied ? (
                        <>
                          <Check size={16} />
                          Copiado!
                        </>
                      ) : (
                        <>
                          <Copy size={16} />
                          Copiar Link
                        </>
                      )}
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={openLink}
                    className="flex items-center justify-center gap-2 w-full py-3 rounded-xl font-bold text-xs border border-[var(--primary)] text-[var(--primary)] hover:bg-[var(--primary-light)] transition-all cursor-pointer"
                  >
                    <ExternalLink size={16} />
                    Testar meu link de agendamento
                  </button>
                </div>

                <p className="text-xs text-[var(--muted)] mt-5 text-center">
                  Seu link é exclusivo:{" "}
                  <strong className="text-[var(--primary)] font-mono">
                    {(typeof window !== "undefined"
                      ? window.location.host
                      : "bellamais.com"
                    ).toUpperCase()}
                    /AGENDAMENTO/{username?.toUpperCase()}
                  </strong>
                </p>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
