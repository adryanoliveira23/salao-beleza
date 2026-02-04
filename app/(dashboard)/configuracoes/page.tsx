"use client";

import React, { useState } from "react";
import { User, Bell, Shield, Palette, Save, Moon, Sun, Link2, Copy, Check, Trash2 } from "lucide-react";
import { Header } from "@/components/Header";
import { useSalonData } from "@/contexts/SalonDataContext";

export default function Settings() {
  const [activeTab, setActiveTab] = useState("profile");
  const [theme, setTheme] = useState("light");
  const [copied, setCopied] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);
  const { clearAllData } = useSalonData();

  const bookingUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/agendar`
      : "/agendar";

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(bookingUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
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

  return (
    <>
      <Header title="Configurações" />

      <div className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-10 flex flex-col gap-4 md:gap-6">
        <div className="bg-white rounded-[16px] md:rounded-[20px] shadow-[0_4px_20px_rgba(0,0,0,0.06)] border border-[#FF6B9D]/10 overflow-hidden flex flex-col md:flex-row min-h-[400px] md:min-h-[600px]">
          {/* Settings Navigation */}
          <div className="w-full md:w-[260px] bg-[#fafafa] border-b md:border-b-0 md:border-r border-[#f0f0f0] p-4 flex flex-row md:flex-col gap-2 overflow-x-auto md:overflow-x-visible shrink-0">
            <button
              onClick={() => setActiveTab("profile")}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium text-sm text-left shrink-0
                ${
                  activeTab === "profile"
                    ? "bg-white text-[#FF6B9D] shadow-sm font-semibold"
                    : "text-[#666] hover:bg-[#eaeaea]"
                }`}
            >
              <User size={18} />
              Perfil
            </button>
            <button
              onClick={() => setActiveTab("booking")}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium text-sm text-left shrink-0
                ${
                  activeTab === "booking"
                    ? "bg-white text-[#FF6B9D] shadow-sm font-semibold"
                    : "text-[#666] hover:bg-[#eaeaea]"
                }`}
            >
              <Link2 size={18} />
              Link de Agendamento
            </button>
            <button
              onClick={() => setActiveTab("notifications")}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium text-sm text-left shrink-0
                ${
                  activeTab === "notifications"
                    ? "bg-white text-[#FF6B9D] shadow-sm font-semibold"
                    : "text-[#666] hover:bg-[#eaeaea]"
                }`}
            >
              <Bell size={18} />
              Notificações
            </button>
            <button
              onClick={() => setActiveTab("appearance")}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium text-sm text-left shrink-0
                ${
                  activeTab === "appearance"
                    ? "bg-white text-[#FF6B9D] shadow-sm font-semibold"
                    : "text-[#666] hover:bg-[#eaeaea]"
                }`}
            >
              <Palette size={18} />
              Aparência
            </button>
            <button
              onClick={() => setActiveTab("security")}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium text-sm text-left shrink-0
                ${
                  activeTab === "security"
                    ? "bg-white text-[#FF6B9D] shadow-sm font-semibold"
                    : "text-[#666] hover:bg-[#eaeaea]"
                }`}
            >
              <Shield size={18} />
              Segurança
            </button>
            <button
              onClick={() => setActiveTab("data")}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium text-sm text-left shrink-0
                ${
                  activeTab === "data"
                    ? "bg-white text-[#FF6B9D] shadow-sm font-semibold"
                    : "text-[#666] hover:bg-[#eaeaea]"
                }`}
            >
              <Trash2 size={18} />
              Dados
            </button>
          </div>

          {/* Settings Content */}
          <div className="flex-1 p-4 md:p-6 lg:p-8 min-w-0">
            {activeTab === "profile" && (
              <div className="max-w-[600px] animate-in fade-in slide-in-from-bottom-2 duration-300">
                <h3 className="text-xl font-bold font-serif text-[#2d1b2e] mb-6">
                  Informações do Perfil
                </h3>

                <div className="flex items-center gap-6 mb-8">
                  <div className="w-[100px] h-[100px] rounded-full bg-gradient-to-br from-[#FF6B9D] to-[#C73866] flex items-center justify-center text-white font-bold text-3xl shadow-lg">
                    AS
                  </div>
                  <div>
                    <button className="bg-white border-2 border-[#f0f0f0] text-[#2d1b2e] px-4 py-2 rounded-xl font-semibold text-sm hover:border-[#FF6B9D] hover:text-[#FF6B9D] transition-colors mb-2">
                      Alterar Foto
                    </button>
                    <p className="text-xs text-[#999]">JPG ou PNG. Max 2MB.</p>
                  </div>
                </div>

                <form className="flex flex-col gap-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div className="flex flex-col gap-2">
                      <label className="font-semibold text-[#2d1b2e] text-sm">
                        Nome
                      </label>
                      <input
                        type="text"
                        defaultValue="Adryan"
                        className="p-3 border-2 border-[#f0f0f0] rounded-xl text-sm focus:outline-none focus:border-[#FF6B9D] transition-all"
                      />
                    </div>
                    <div className="flex flex-col gap-2">
                      <label className="font-semibold text-[#2d1b2e] text-sm">
                        Sobrenome
                      </label>
                      <input
                        type="text"
                        defaultValue="Silva"
                        className="p-3 border-2 border-[#f0f0f0] rounded-xl text-sm focus:outline-none focus:border-[#FF6B9D] transition-all"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="font-semibold text-[#2d1b2e] text-sm">
                      Email
                    </label>
                    <input
                      type="email"
                      defaultValue="adryan@example.com"
                      className="p-3 border-2 border-[#f0f0f0] rounded-xl text-sm focus:outline-none focus:border-[#FF6B9D] transition-all"
                    />
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="font-semibold text-[#2d1b2e] text-sm">
                      Telefone
                    </label>
                    <input
                      type="tel"
                      defaultValue="(81) 99999-9999"
                      className="p-3 border-2 border-[#f0f0f0] rounded-xl text-sm focus:outline-none focus:border-[#FF6B9D] transition-all"
                    />
                  </div>

                  <div className="pt-4">
                    <button
                      type="button"
                      className="flex items-center gap-2 bg-gradient-to-br from-[#FF6B9D] to-[#C73866] text-white px-6 py-3 rounded-xl font-semibold shadow-lg hover:-translate-y-0.5 transition-all"
                    >
                      <Save size={18} />
                      Salvar Alterações
                    </button>
                  </div>
                </form>
              </div>
            )}

            {activeTab === "booking" && (
              <div className="max-w-[600px] animate-in fade-in slide-in-from-bottom-2 duration-300">
                <h3 className="text-xl font-bold font-serif text-[#2d1b2e] mb-6">
                  Link de Agendamento
                </h3>
                <p className="text-[#666] mb-6">
                  Compartilhe este link com seus clientes para que eles agendem online. Os agendamentos aparecerão automaticamente na sua agenda.
                </p>
                <div className="flex flex-col sm:flex-row gap-3">
                  <input
                    type="text"
                    readOnly
                    value={bookingUrl}
                    className="flex-1 p-3 border-2 border-[#f0f0f0] rounded-xl text-sm bg-[#fafafa]"
                  />
                  <button
                    type="button"
                    onClick={copyLink}
                    className="flex items-center justify-center gap-2 bg-gradient-to-br from-[#FF6B9D] to-[#C73866] text-white px-6 py-3 rounded-xl font-semibold shadow-lg hover:-translate-y-0.5 transition-all shrink-0"
                  >
                    {copied ? (
                      <>
                        <Check size={18} />
                        Copiado!
                      </>
                    ) : (
                      <>
                        <Copy size={18} />
                        Copiar link
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {activeTab === "appearance" && (
              <div className="max-w-[600px] animate-in fade-in slide-in-from-bottom-2 duration-300">
                <h3 className="text-xl font-bold font-serif text-[#2d1b2e] mb-6">
                  Aparência do Sistema
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <button
                    onClick={() => setTheme("light")}
                    className={`p-4 rounded-2xl border-2 flex flex-col items-center gap-3 transition-all
                      ${theme === "light" ? "border-[#FF6B9D] bg-[#fff0f5]" : "border-[#f0f0f0] hover:border-[#FF6B9D]/50"}`}
                  >
                    <div className="w-full h-[120px] bg-white rounded-lg border border-[#f0f0f0] relative overflow-hidden shadow-sm">
                      <div className="absolute top-0 left-0 w-[20%] h-full bg-[#f8f8f8] border-r border-[#eee]"></div>
                      <div className="absolute top-3 left-[25%] right-3 h-4 bg-[#f0f0f0] rounded"></div>
                    </div>
                    <div className="flex items-center gap-2 font-semibold text-[#2d1b2e]">
                      <Sun size={18} />
                      Claro (Padrão)
                    </div>
                  </button>

                  <button
                    onClick={() => setTheme("dark")}
                    className={`p-4 rounded-2xl border-2 flex flex-col items-center gap-3 transition-all
                      ${theme === "dark" ? "border-[#FF6B9D] bg-[#2d1b2e]/5" : "border-[#f0f0f0] hover:border-[#FF6B9D]/50"}`}
                  >
                    <div className="w-full h-[120px] bg-[#1a1a1a] rounded-lg border border-[#333] relative overflow-hidden shadow-sm">
                      <div className="absolute top-0 left-0 w-[20%] h-full bg-[#2a2a2a] border-r border-[#333]"></div>
                      <div className="absolute top-3 left-[25%] right-3 h-4 bg-[#333] rounded"></div>
                    </div>
                    <div className="flex items-center gap-2 font-semibold text-[#2d1b2e]">
                      <Moon size={18} />
                      Escuro (Em breve)
                    </div>
                  </button>
                </div>
              </div>
            )}

            {activeTab === "data" && (
              <div className="max-w-[600px] animate-in fade-in slide-in-from-bottom-2 duration-300">
                <h3 className="text-xl font-bold font-serif text-[#2d1b2e] mb-6">
                  Gerenciar Dados
                </h3>
                <p className="text-[#666] mb-6">
                  Limpar todos os dados do sistema (clientes, serviços, profissionais e agendamentos). Esta ação não pode ser desfeita.
                </p>
                {!confirmClear ? (
                  <button
                    type="button"
                    onClick={() => setConfirmClear(true)}
                    className="flex items-center gap-2 bg-[#dc2626] hover:bg-[#b91c1c] text-white px-6 py-3 rounded-xl font-semibold shadow-lg hover:-translate-y-0.5 transition-all"
                  >
                    <Trash2 size={18} />
                    Limpar todos os dados
                  </button>
                ) : (
                  <div className="flex flex-col gap-3">
                    <p className="text-[#dc2626] font-semibold">
                      Tem certeza? Todos os dados serão perdidos.
                    </p>
                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={() => {
                          clearAllData();
                          setConfirmClear(false);
                        }}
                        className="flex items-center gap-2 bg-[#dc2626] hover:bg-[#b91c1c] text-white px-6 py-3 rounded-xl font-semibold"
                      >
                        Sim, excluir tudo
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmClear(false)}
                        className="bg-white border-2 border-[#f0f0f0] text-[#666] px-6 py-3 rounded-xl font-semibold hover:border-[#FF6B9D] hover:text-[#FF6B9D]"
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Other tabs placeholders */}
            {(activeTab === "notifications" || activeTab === "security") && (
              <div className="flex flex-col items-center justify-center h-full text-[#999] animate-in fade-in zoom-in duration-300">
                <Shield size={48} className="mb-4 opacity-20" />
                <p>Configurações em desenvolvimento...</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
