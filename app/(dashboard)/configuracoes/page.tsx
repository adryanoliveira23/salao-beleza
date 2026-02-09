"use client";

import React, { useState, useEffect } from "react";
import {
  User,
  Bell,
  Shield,
  Palette,
  Save,
  Moon,
  Sun,
  Link2,
  Copy,
  Check,
  Trash2,
  Loader2,
} from "lucide-react";
import { Header } from "@/components/Header";
import { useSalonData } from "@/contexts/SalonDataContext";
import { useAuth } from "@/contexts/AuthContext";
import { useNotifications } from "@/contexts/NotificationContext";
import { supabase } from "@/app/lib/supabase";

export default function Settings() {
  const [activeTab, setActiveTab] = useState("profile");
  const [theme, setTheme] = useState("light");
  const [copied, setCopied] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);
  const { clearAllData } = useSalonData();
  const { user, profile, refreshProfile } = useAuth();
  const { notifications, markAsRead, clearNotifications } = useNotifications();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    salon_name: "",
    username: "",
    avatar_url: "",
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  useEffect(() => {
    if (profile) {
      setFormData({
        name: profile.name || "",
        email: profile.email || "",
        phone: "", // Phone is not in profile interface yet, keeping blank or adding to profile later
        salon_name: profile.salon_name || "",
        username: profile.username || "",
        avatar_url: profile.avatar_url || "",
      });
    }
  }, [profile]);

  const [uploading, setUploading] = useState(false);

  const uploadAvatar = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true);

      if (!event.target.files || event.target.files.length === 0) {
        throw new Error("You must select an image to upload.");
      }

      const file = event.target.files[0];
      const fileExt = file.name.split(".").pop();
      const fileName = `${user?.id}-${Math.random()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, file);

      if (uploadError) {
        throw uploadError;
      }

      const { data } = supabase.storage.from("avatars").getPublicUrl(filePath);

      setFormData((prev) => ({ ...prev, avatar_url: data.publicUrl }));

      // Auto-save the new avatar URL to profile immediately
      if (user) {
        await supabase.from("profiles").upsert({
          id: user.id,
          avatar_url: data.publicUrl,
          updated_at: new Date().toISOString(),
        });
        await refreshProfile();
        setMessage({ type: "success", text: "Foto de perfil atualizada!" });
      }
    } catch (error) {
      console.error("Error uploading avatar:", error);
      setMessage({ type: "error", text: "Erro ao fazer upload da imagem." });
    } finally {
      setUploading(false);
    }
  };

  const bookingUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/agendar${formData.username ? `/${formData.username}` : ""}`
      : "/agendar";

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

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);
    setMessage(null);

    try {
      const { error } = await supabase.from("profiles").upsert({
        id: user.id,
        name: formData.name,
        salon_name: formData.salon_name,
        username: formData.username,
        avatar_url: formData.avatar_url,
        updated_at: new Date().toISOString(),
      });

      if (error) throw error;

      await refreshProfile();
      setMessage({ type: "success", text: "Perfil atualizado com sucesso!" });
    } catch (error) {
      console.error("Error updating profile:", error);
      setMessage({ type: "error", text: "Erro ao atualizar perfil." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Header title="Configurações" />

      <div className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-10 flex flex-col gap-4 md:gap-6">
        <div className="bg-white rounded-[16px] md:rounded-[20px] shadow-[0_4px_20px_rgba(0,0,0,0.06)] border border-[#FF6B9D]/10 overflow-hidden flex flex-col md:flex-row min-h-[400px] md:min-h-[600px]">
          {/* Settings Navigation */}
          <div className="w-full md:w-[260px] bg-[#fafafa] border-b md:border-b-0 md:border-r border-[#f0f0f0] p-4 flex flex-row md:flex-col gap-2 overflow-x-auto md:overflow-x-visible shrink-0">
            {[
              { id: "profile", label: "Perfil", icon: User },
              { id: "booking", label: "Link de Agendamento", icon: Link2 },
              { id: "notifications", label: "Notificações", icon: Bell },
              { id: "appearance", label: "Aparência", icon: Palette },
              { id: "security", label: "Segurança", icon: Shield },
              { id: "data", label: "Dados", icon: Trash2 },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium text-sm text-left shrink-0
                ${
                  activeTab === tab.id
                    ? "bg-white text-[#FF6B9D] shadow-sm font-semibold"
                    : "text-[#666] hover:bg-[#eaeaea]"
                }`}
              >
                <tab.icon size={18} />
                {tab.label}
              </button>
            ))}
          </div>

          {/* Settings Content */}
          <div className="flex-1 p-4 md:p-6 lg:p-8 min-w-0">
            {activeTab === "profile" && (
              <div className="max-w-[600px] animate-in fade-in slide-in-from-bottom-2 duration-300">
                <h3 className="text-xl font-bold font-serif text-[#2d1b2e] mb-6">
                  Informações do Perfil
                </h3>

                <div className="flex items-center gap-6 mb-8">
                  <div className="relative w-[100px] h-[100px] rounded-full overflow-hidden shadow-lg border-2 border-white">
                    {formData.avatar_url ? (
                      <img
                        src={formData.avatar_url}
                        alt="Profile"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-linear-to-br from-[#FF6B9D] to-[#C73866] flex items-center justify-center text-white font-bold text-3xl">
                        {profile?.name?.substring(0, 2).toUpperCase() || "US"}
                      </div>
                    )}
                    {uploading && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-10">
                        <Loader2
                          className="animate-spin text-white"
                          size={24}
                        />
                      </div>
                    )}
                  </div>
                  <div>
                    <input
                      type="file"
                      id="avatar-upload"
                      className="hidden"
                      accept="image/*"
                      onChange={uploadAvatar}
                      disabled={uploading}
                    />
                    <label
                      htmlFor="avatar-upload"
                      className={`inline-block bg-white border-2 border-[#f0f0f0] text-[#2d1b2e] px-4 py-2 rounded-xl font-semibold text-sm hover:border-[#FF6B9D] hover:text-[#FF6B9D] transition-colors mb-2 cursor-pointer ${uploading ? "opacity-50 cursor-not-allowed" : ""}`}
                    >
                      {uploading ? "Enviando..." : "Alterar Foto"}
                    </label>
                    <p className="text-xs text-[#999]">JPG ou PNG. Max 2MB.</p>
                  </div>
                </div>

                <form
                  onSubmit={handleSaveProfile}
                  className="flex flex-col gap-5"
                >
                  <div className="flex flex-col gap-2">
                    <label className="font-semibold text-[#2d1b2e] text-sm">
                      Nome Completo
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      className="p-3 border-2 border-[#f0f0f0] rounded-xl text-sm focus:outline-none focus:border-[#FF6B9D] transition-all"
                    />
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="font-semibold text-[#2d1b2e] text-sm">
                      Nome do Salão
                    </label>
                    <input
                      type="text"
                      value={formData.salon_name}
                      onChange={(e) =>
                        setFormData({ ...formData, salon_name: e.target.value })
                      }
                      className="p-3 border-2 border-[#f0f0f0] rounded-xl text-sm focus:outline-none focus:border-[#FF6B9D] transition-all"
                      placeholder="Ex: Studio Glow"
                    />
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="font-semibold text-[#2d1b2e] text-sm">
                      Nome de Usuário (para link)
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-3 text-[#999] text-sm">
                        @
                      </span>
                      <input
                        type="text"
                        value={formData.username}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            username: e.target.value
                              .toLowerCase()
                              .replace(/[^a-z0-9_]/g, ""),
                          })
                        }
                        className="pl-8 p-3 w-full border-2 border-[#f0f0f0] rounded-xl text-sm focus:outline-none focus:border-[#FF6B9D] transition-all"
                        placeholder="nome_usuario"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="font-semibold text-[#2d1b2e] text-sm">
                      Email
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      disabled
                      className="p-3 border-2 border-[#f0f0f0] rounded-xl text-sm bg-[#fafafa] text-[#999]"
                    />
                  </div>

                  {message && (
                    <div
                      className={`p-3 rounded-xl text-sm ${message.type === "success" ? "bg-green-50 text-green-600 border border-green-200" : "bg-red-50 text-red-600 border border-red-200"}`}
                    >
                      {message.text}
                    </div>
                  )}

                  <div className="pt-4">
                    <button
                      type="submit"
                      disabled={loading}
                      className="flex items-center gap-2 bg-linear-to-br from-[#FF6B9D] to-[#C73866] text-white px-6 py-3 rounded-xl font-semibold shadow-lg hover:-translate-y-0.5 transition-all disabled:opacity-50"
                    >
                      {loading ? (
                        <Loader2 className="animate-spin" size={18} />
                      ) : (
                        <Save size={18} />
                      )}
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
                  Compartilhe este link com seus clientes para que eles agendem
                  online. Os agendamentos aparecerão automaticamente na sua
                  agenda.
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
                    className="flex items-center justify-center gap-2 bg-linear-to-br from-[#FF6B9D] to-[#C73866] text-white px-6 py-3 rounded-xl font-semibold shadow-lg hover:-translate-y-0.5 transition-all shrink-0"
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

            {activeTab === "notifications" && (
              <div className="max-w-[600px] animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold font-serif text-[#2d1b2e]">
                    Notificações
                  </h3>
                  {notifications.length > 0 && (
                    <button
                      onClick={clearNotifications}
                      className="text-xs text-[#FF6B9D] hover:underline"
                    >
                      Limpar todas
                    </button>
                  )}
                </div>

                {notifications.length === 0 ? (
                  <div className="text-center py-10 text-[#999]">
                    <Bell size={48} className="mx-auto mb-4 opacity-20" />
                    <p>Nenhuma notificação no momento.</p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-3">
                    {notifications.map((notif) => (
                      <div
                        key={notif.id}
                        className={`p-4 rounded-xl border border-[#f0f0f0] ${
                          !notif.read
                            ? "bg-white shadow-sm border-l-4 border-l-[#FF6B9D]"
                            : "bg-[#fafafa]"
                        }`}
                        onClick={() => markAsRead(notif.id)}
                      >
                        <div className="flex justify-between items-start mb-1">
                          <h4 className="font-semibold text-[#2d1b2e] text-sm">
                            {notif.title}
                          </h4>
                          <span className="text-xs text-[#999]">
                            {new Date(notif.date).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-sm text-[#666]">{notif.message}</p>
                      </div>
                    ))}
                  </div>
                )}
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
                  Limpar todos os dados do sistema (clientes, serviços,
                  profissionais e agendamentos). Esta ação não pode ser
                  desfeita.
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

            {activeTab === "security" && (
              <div className="flex flex-col items-center justify-center h-full text-[#999] animate-in fade-in zoom-in duration-300">
                <Shield size={48} className="mb-4 opacity-20" />
                <p>Configurações de segurança em desenvolvimento...</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
