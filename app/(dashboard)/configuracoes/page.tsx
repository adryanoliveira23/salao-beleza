"use client";

export const dynamic = "force-dynamic";

import React, { useState, useEffect } from "react";
import {
  User,
  Link2,
  Bell,
  Palette,
  Shield,
  Trash2,
  Loader2,
  Save,
  DollarSign,
  Check,
  Copy,
  Sun,
  Moon,
  Clock,
  CalendarCheck,
  Lock,
} from "lucide-react";
import { Header } from "@/components/Header";
import { useSalonData } from "@/contexts/SalonDataContext";
import {
  useAuth,
  BusinessDayHours,
  BookingRules,
  DEFAULT_BUSINESS_HOURS,
  DEFAULT_BOOKING_RULES,
} from "@/contexts/AuthContext";
import { useNotifications } from "@/contexts/NotificationContext";
import { storage, db, auth } from "@/app/lib/firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { doc, updateDoc } from "firebase/firestore";
import { sendPasswordResetEmail, updatePassword } from "firebase/auth";
import { useFinance, NeighborhoodType } from "@/contexts/FinanceContext";

const DAY_LABELS: { key: string; label: string }[] = [
  { key: "monday", label: "Segunda-feira" },
  { key: "tuesday", label: "Terça-feira" },
  { key: "wednesday", label: "Quarta-feira" },
  { key: "thursday", label: "Quinta-feira" },
  { key: "friday", label: "Sexta-feira" },
  { key: "saturday", label: "Sábado" },
  { key: "sunday", label: "Domingo" },
];

export default function Settings() {
  const [activeTab, setActiveTab] = useState("profile");
  const [copied, setCopied] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);
  const { clearAllData } = useSalonData();
  const { user, profile, themeMode, refreshProfile, updateProfileData } = useAuth();
  const { notifications, markAsRead, clearNotifications } = useNotifications();
  const { settings, updateSettings } = useFinance();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    salon_name: "",
    username: "",
    avatar_url: "",
    address: "",
    instagram: "",
    cnpj: "",
  });

  const [businessHours, setBusinessHours] = useState<
    Record<string, BusinessDayHours>
  >(DEFAULT_BUSINESS_HOURS);
  const [holidaysText, setHolidaysText] = useState("");
  const [bookingRules, setBookingRules] = useState<BookingRules>(
    DEFAULT_BOOKING_RULES,
  );

  const [financeForm, setFinanceForm] = useState({
    neighborhood: "media" as NeighborhoodType,
    chairs: 2,
    rentCost: 0,
    energyCost: 0,
    internetCost: 0,
    systemCost: 0,
    monthlyGoal: 0,
    ownerSalaryPercent: 0,
  });

  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  useEffect(() => {
    if (profile) {
      setFormData({
        name: profile.name || "",
        email: profile.email || "",
        phone: profile.phone || "",
        salon_name: profile.salon_name || "",
        username: profile.username || "",
        avatar_url: profile.avatar_url || "",
        address: profile.address || "",
        instagram: profile.instagram || "",
        cnpj: profile.cnpj || "",
      });
      if (profile.businessHours) {
        setBusinessHours({
          ...DEFAULT_BUSINESS_HOURS,
          ...profile.businessHours,
        });
      }
      if (profile.holidays) {
        setHolidaysText(profile.holidays.map((h) => h.date).join(", "));
      }
      if (profile.bookingRules) {
        setBookingRules({
          ...DEFAULT_BOOKING_RULES,
          ...profile.bookingRules,
        });
      }
    }
  }, [profile]);

  useEffect(() => {
    if (settings) {
      setFinanceForm({
        neighborhood: settings.neighborhood,
        chairs: settings.chairs,
        rentCost: settings.rentCost,
        energyCost: settings.energyCost,
        internetCost: settings.internetCost,
        systemCost: settings.systemCost,
        monthlyGoal: settings.monthlyGoal,
        ownerSalaryPercent: settings.ownerSalaryPercent,
      });
    }
  }, [settings]);

  const uploadAvatar = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true);
      if (!event.target.files || event.target.files.length === 0) return;
      const file = event.target.files[0];
      const fileExt = file.name.split(".").pop();
      const fileName = `${user?.uid}-${Date.now()}.${fileExt}`;
      const storageRef = ref(storage, `avatars/${fileName}`);

      await uploadBytes(storageRef, file);
      const publicUrl = await getDownloadURL(storageRef);

      setFormData((prev) => ({ ...prev, avatar_url: publicUrl }));

      if (user) {
        const userRef = doc(db, "profiles", user.uid);
        await updateDoc(userRef, { avatar_url: publicUrl });
        await refreshProfile();
        setMessage({
          type: "success",
          text: "Logo / Foto atualizada com sucesso!",
        });
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
      setCopied(true);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);
    setMessage(null);
    try {
      await updateProfileData({
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        salon_name: formData.salon_name,
        username: formData.username,
        avatar_url: formData.avatar_url,
        address: formData.address,
        instagram: formData.instagram,
        cnpj: formData.cnpj,
      });
      setMessage({
        type: "success",
        text: "Dados do salão salvos com sucesso!",
      });
    } catch {
      setMessage({ type: "error", text: "Erro ao atualizar perfil." });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveHoursAndRules = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    try {
      const holidays = holidaysText
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
        .map((dateStr, i) => ({
          id: `hol-${i}`,
          date: dateStr,
          name: "Feriado",
        }));
      await updateProfileData({
        businessHours,
        holidays,
        bookingRules,
      });
      setMessage({
        type: "success",
        text: "Horários de funcionamento e políticas de agendamento salvos!",
      });
    } catch {
      setMessage({ type: "error", text: "Erro ao salvar regras." });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveFinance = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    try {
      await updateSettings(financeForm);
      setMessage({
        type: "success",
        text: "Configurações financeiras salvas!",
      });
    } catch {
      setMessage({ type: "error", text: "Erro ao salvar configurações." });
    } finally {
      setLoading(false);
    }
  };

  const handleThemeChange = async (mode: "light" | "dark") => {
    if (typeof document !== "undefined") {
      document.documentElement.classList.toggle("dark", mode === "dark");
    }
    await updateProfileData({ themeMode: mode });
  };

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser || newPassword.length < 6) return;
    setLoading(true);
    setMessage(null);
    try {
      await updatePassword(auth.currentUser, newPassword);
      setNewPassword("");
      setMessage({ type: "success", text: "Senha alterada com sucesso!" });
    } catch {
      setMessage({
        type: "error",
        text: "Para alterar a senha diretamente, faça login novamente ou use o botão de enviar e-mail de redefinição abaixo.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSendResetEmail = async () => {
    if (!formData.email) return;
    try {
      await sendPasswordResetEmail(auth, formData.email);
      setMessage({
        type: "success",
        text: `E-mail de redefinição de senha enviado para ${formData.email}!`,
      });
    } catch {
      setMessage({
        type: "error",
        text: "Erro ao enviar e-mail de redefinição.",
      });
    }
  };

  return (
    <div className="flex flex-col h-full bg-[var(--background)]">
      <Header title="Configurações do Salão" />

      <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-10">
        <div className="bg-[var(--card-bg)] rounded-3xl shadow-xs border border-[var(--card-border)] overflow-hidden flex flex-col md:flex-row min-h-[600px]">
          {/* Sidebar Tabs */}
          <div className="w-full md:w-[260px] bg-[var(--background)]/60 border-b md:border-b-0 md:border-r border-[var(--card-border)] p-3 sm:p-4 flex flex-row md:flex-col gap-1.5 overflow-x-auto shrink-0 no-scrollbar">
            {[
              { id: "profile", label: "Identidade & Salão", icon: User },
              { id: "hours", label: "Horários & Políticas", icon: Clock },
              {
                id: "financial",
                label: "Estrutura Financeira",
                icon: DollarSign,
              },
              { id: "booking", label: "Link de Agendamento", icon: Link2 },
              { id: "notifications", label: "Notificações", icon: Bell },
              { id: "appearance", label: "Modo Claro / Escuro", icon: Palette },
              { id: "security", label: "Segurança & Acesso", icon: Shield },
              { id: "data", label: "Dados & LGPD", icon: Trash2 },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  setMessage(null);
                }}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-semibold text-xs sm:text-sm text-left shrink-0 cursor-pointer ${
                  activeTab === tab.id
                    ? "bg-[var(--primary)] text-white shadow-xs"
                    : "text-[var(--muted)] hover:bg-[var(--primary-light)]/40 hover:text-[var(--foreground)]"
                }`}
              >
                <tab.icon size={17} />
                {tab.label}
              </button>
            ))}
          </div>

          {/* Content Area */}
          <div className="flex-1 p-5 sm:p-6 lg:p-8 min-w-0">
            {message && (
              <div
                className={`mb-6 p-3.5 rounded-xl text-sm font-medium ${
                  message.type === "success"
                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                    : "bg-rose-50 text-rose-700 border border-rose-200"
                }`}
              >
                {message.text}
              </div>
            )}

            {/* TAB: PROFILE & VISUAL IDENTITY */}
            {activeTab === "profile" && (
              <div className="max-w-2xl space-y-6">
                <h3 className="text-xl font-bold text-[var(--foreground)]">
                  Identidade Visual, Endereço & Contato
                </h3>

                <div className="flex flex-col sm:flex-row sm:items-center gap-5">
                  <div className="relative w-24 h-24 rounded-full overflow-hidden shadow-md border-2 border-[var(--primary)] shrink-0">
                    {formData.avatar_url ? (
                      <img
                        src={formData.avatar_url}
                        alt="Logo do Salão"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-[#b83b6b] to-[#88234b] flex items-center justify-center text-white font-bold text-2xl">
                        {formData.salon_name?.slice(0, 2).toUpperCase() || "SB"}
                      </div>
                    )}
                    {uploading && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                        <Loader2
                          className="animate-spin text-white"
                          size={22}
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
                      className="inline-block bg-[var(--background)] border border-[var(--card-border)] text-[var(--foreground)] px-4 py-2.5 rounded-xl font-semibold text-xs hover:border-[var(--primary)] cursor-pointer"
                    >
                      {uploading
                        ? "Enviando..."
                        : "Alterar Logo / Foto do Salão"}
                    </label>
                    <p className="text-xs text-[var(--muted)] mt-1">
                      Exibida no painel e na página pública de agendamento online.
                    </p>
                  </div>
                </div>

                <form onSubmit={handleSaveProfile} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold uppercase text-[var(--muted)] mb-1">
                        Nome da Proprietária / Responsável
                      </label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) =>
                          setFormData({ ...formData, name: e.target.value })
                        }
                        className="w-full p-3 border border-[var(--card-border)] rounded-xl text-sm bg-[var(--background)]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase text-[var(--muted)] mb-1">
                        Nome do Salão / Studio
                      </label>
                      <input
                        type="text"
                        value={formData.salon_name}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            salon_name: e.target.value,
                          })
                        }
                        className="w-full p-3 border border-[var(--card-border)] rounded-xl text-sm bg-[var(--background)]"
                        placeholder="Ex: Studio Glow Beleza"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold uppercase text-[var(--muted)] mb-1">
                        Usuário para Link (@slug)
                      </label>
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
                        className="w-full p-3 border border-[var(--card-border)] rounded-xl text-sm bg-[var(--background)]"
                        placeholder="studioglow"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase text-[var(--muted)] mb-1">
                        WhatsApp / Telefone Comercial
                      </label>
                      <input
                        type="text"
                        value={formData.phone}
                        onChange={(e) =>
                          setFormData({ ...formData, phone: e.target.value })
                        }
                        className="w-full p-3 border border-[var(--card-border)] rounded-xl text-sm bg-[var(--background)]"
                        placeholder="(11) 99999-9999"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase text-[var(--muted)] mb-1">
                      Endereço Completo do Salão
                    </label>
                    <input
                      type="text"
                      value={formData.address}
                      onChange={(e) =>
                        setFormData({ ...formData, address: e.target.value })
                      }
                      className="w-full p-3 border border-[var(--card-border)] rounded-xl text-sm bg-[var(--background)]"
                      placeholder="Rua das Flores, 123 - Sala 2, Centro"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold uppercase text-[var(--muted)] mb-1">
                        Instagram (@perfil)
                      </label>
                      <input
                        type="text"
                        value={formData.instagram}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            instagram: e.target.value,
                          })
                        }
                        className="w-full p-3 border border-[var(--card-border)] rounded-xl text-sm bg-[var(--background)]"
                        placeholder="@studioglow"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase text-[var(--muted)] mb-1">
                        CNPJ / CPF Comercial
                      </label>
                      <input
                        type="text"
                        value={formData.cnpj}
                        onChange={(e) =>
                          setFormData({ ...formData, cnpj: e.target.value })
                        }
                        className="w-full p-3 border border-[var(--card-border)] rounded-xl text-sm bg-[var(--background)]"
                        placeholder="00.000.000/0001-00"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="flex items-center justify-center gap-2 bg-[var(--primary)] hover:bg-[var(--primary-dark)] text-white px-6 py-3 rounded-xl font-bold text-sm shadow-sm cursor-pointer w-full sm:w-auto"
                  >
                    {loading ? (
                      <Loader2 className="animate-spin" size={18} />
                    ) : (
                      <Save size={18} />
                    )}
                    Salvar Identidade do Salão
                  </button>
                </form>
              </div>
            )}

            {/* TAB: OPERATING HOURS & POLICIES */}
            {activeTab === "hours" && (
              <form
                onSubmit={handleSaveHoursAndRules}
                className="max-w-2xl space-y-6"
              >
                <div>
                  <h3 className="text-xl font-bold text-[var(--foreground)] mb-1">
                    Horários de Funcionamento & Feriados
                  </h3>
                  <p className="text-xs text-[var(--muted)] mb-4">
                    Estes horários são respeitados pela Agenda Inteligente, pelo Agendamento Online e pela IA do WhatsApp.
                  </p>

                  <div className="space-y-2.5">
                    {DAY_LABELS.map(({ key, label }) => {
                      const bh =
                        businessHours[key] || DEFAULT_BUSINESS_HOURS[key];
                      return (
                        <div
                          key={key}
                          className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl bg-[var(--background)] border border-[var(--card-border)]"
                        >
                          <span className="font-semibold text-sm w-36 text-[var(--foreground)]">
                            {label}
                          </span>
                          <label className="flex items-center gap-2 text-xs font-medium cursor-pointer">
                            <input
                              type="checkbox"
                              checked={bh.open}
                              onChange={(e) => {
                                setBusinessHours((prev) => ({
                                  ...prev,
                                  [key]: { ...bh, open: e.target.checked },
                                }));
                              }}
                            />
                            {bh.open ? "Aberto" : "Fechado"}
                          </label>
                          {bh.open && (
                            <div className="flex items-center gap-2">
                              <input
                                type="time"
                                value={bh.start}
                                onChange={(e) => {
                                  setBusinessHours((prev) => ({
                                    ...prev,
                                    [key]: { ...bh, start: e.target.value },
                                  }));
                                }}
                                className="px-2.5 py-1.5 rounded-lg border border-[var(--card-border)] bg-[var(--card-bg)] text-xs"
                              />
                              <span className="text-xs text-[var(--muted)]">
                                às
                              </span>
                              <input
                                type="time"
                                value={bh.end}
                                onChange={(e) => {
                                  setBusinessHours((prev) => ({
                                    ...prev,
                                    [key]: { ...bh, end: e.target.value },
                                  }));
                                }}
                                className="px-2.5 py-1.5 rounded-lg border border-[var(--card-border)] bg-[var(--card-bg)] text-xs"
                              />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-[var(--muted)] mb-1">
                    Feriados / Datas Fechadas (Separados por vírgula: AAAA-MM-DD)
                  </label>
                  <input
                    type="text"
                    value={holidaysText}
                    onChange={(e) => setHolidaysText(e.target.value)}
                    placeholder="Ex: 2026-12-25, 2027-01-01"
                    className="w-full p-3 rounded-xl border border-[var(--card-border)] bg-[var(--background)] text-sm"
                  />
                </div>

                <div className="pt-4 border-t border-[var(--card-border)] space-y-4">
                  <h4 className="font-bold text-base text-[var(--foreground)] flex items-center gap-2">
                    <CalendarCheck
                      size={18}
                      className="text-[var(--primary)]"
                    />
                    Regras de Cancelamento, Antecedência e Sinal
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-bold uppercase text-[var(--muted)] mb-1">
                        Antecedência Mínima (h)
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={bookingRules.minAdvanceHours}
                        onChange={(e) =>
                          setBookingRules({
                            ...bookingRules,
                            minAdvanceHours: Number(e.target.value),
                          })
                        }
                        className="w-full p-2.5 rounded-xl border border-[var(--card-border)] bg-[var(--background)] text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase text-[var(--muted)] mb-1">
                        Aviso Cancelamento (h)
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={bookingRules.cancellationHours}
                        onChange={(e) =>
                          setBookingRules({
                            ...bookingRules,
                            cancellationHours: Number(e.target.value),
                          })
                        }
                        className="w-full p-2.5 rounded-xl border border-[var(--card-border)] bg-[var(--background)] text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase text-[var(--muted)] mb-1">
                        Tolerância Atraso (min)
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={bookingRules.lateToleranceMinutes}
                        onChange={(e) =>
                          setBookingRules({
                            ...bookingRules,
                            lateToleranceMinutes: Number(e.target.value),
                          })
                        }
                        className="w-full p-2.5 rounded-xl border border-[var(--card-border)] bg-[var(--background)] text-sm"
                      />
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-[var(--background)] border border-[var(--card-border)] space-y-3">
                    <label className="flex items-center gap-2 font-semibold text-sm cursor-pointer">
                      <input
                        type="checkbox"
                        checked={bookingRules.requireDeposit}
                        onChange={(e) =>
                          setBookingRules({
                            ...bookingRules,
                            requireDeposit: e.target.checked,
                          })
                        }
                      />
                      Solicitar pagamento de Sinal (PIX) no Agendamento Online
                    </label>
                    {bookingRules.requireDeposit && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                        <div>
                          <label className="block text-xs font-bold uppercase text-[var(--muted)] mb-1">
                            Percentual do Sinal (%)
                          </label>
                          <input
                            type="number"
                            min="5"
                            max="100"
                            value={bookingRules.depositPercent}
                            onChange={(e) =>
                              setBookingRules({
                                ...bookingRules,
                                depositPercent: Number(e.target.value),
                              })
                            }
                            className="w-full p-2.5 rounded-xl border border-[var(--card-border)] bg-[var(--card-bg)] text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold uppercase text-[var(--muted)] mb-1">
                            Chave PIX do Salão para Sinal
                          </label>
                          <input
                            type="text"
                            value={bookingRules.pixKey || ""}
                            onChange={(e) =>
                              setBookingRules({
                                ...bookingRules,
                                pixKey: e.target.value,
                              })
                            }
                            placeholder="CNPJ, E-mail ou Telefone"
                            className="w-full p-2.5 rounded-xl border border-[var(--card-border)] bg-[var(--card-bg)] text-sm"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="flex items-center justify-center gap-2 bg-[var(--primary)] text-white px-6 py-3 rounded-xl font-bold text-sm shadow-sm cursor-pointer w-full sm:w-auto"
                >
                  <Save size={18} />
                  Salvar Horários e Regras
                </button>
              </form>
            )}

            {/* TAB: FINANCIAL */}
            {activeTab === "financial" && (
              <form onSubmit={handleSaveFinance} className="max-w-xl space-y-5">
                <h3 className="text-xl font-bold text-[var(--foreground)]">
                  Estrutura Financeira & Custos Fixos Base
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase text-[var(--muted)] mb-1">
                      Perfil do Bairro
                    </label>
                    <select
                      value={financeForm.neighborhood}
                      onChange={(e) =>
                        setFinanceForm({
                          ...financeForm,
                          neighborhood: e.target.value as NeighborhoodType,
                        })
                      }
                      className="w-full p-3 border border-[var(--card-border)] rounded-xl text-sm bg-[var(--background)]"
                    >
                      <option value="simples">Popular</option>
                      <option value="media">Bairro Médio</option>
                      <option value="rica">Bairro Nobre</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase text-[var(--muted)] mb-1">
                      Cadeiras / Estações
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={financeForm.chairs}
                      onChange={(e) =>
                        setFinanceForm({
                          ...financeForm,
                          chairs: Number(e.target.value),
                        })
                      }
                      className="w-full p-3 border border-[var(--card-border)] rounded-xl text-sm bg-[var(--background)]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase text-[var(--muted)] mb-1">
                      Aluguel (R$)
                    </label>
                    <input
                      type="number"
                      value={financeForm.rentCost}
                      onChange={(e) =>
                        setFinanceForm({
                          ...financeForm,
                          rentCost: Number(e.target.value),
                        })
                      }
                      className="w-full p-2.5 border border-[var(--card-border)] rounded-xl text-sm bg-[var(--background)]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase text-[var(--muted)] mb-1">
                      Energia & Água (R$)
                    </label>
                    <input
                      type="number"
                      value={financeForm.energyCost}
                      onChange={(e) =>
                        setFinanceForm({
                          ...financeForm,
                          energyCost: Number(e.target.value),
                        })
                      }
                      className="w-full p-2.5 border border-[var(--card-border)] rounded-xl text-sm bg-[var(--background)]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase text-[var(--muted)] mb-1">
                      Internet (R$)
                    </label>
                    <input
                      type="number"
                      value={financeForm.internetCost}
                      onChange={(e) =>
                        setFinanceForm({
                          ...financeForm,
                          internetCost: Number(e.target.value),
                        })
                      }
                      className="w-full p-2.5 border border-[var(--card-border)] rounded-xl text-sm bg-[var(--background)]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase text-[var(--muted)] mb-1">
                      Meta Mensal do Salão (R$)
                    </label>
                    <input
                      type="number"
                      value={financeForm.monthlyGoal}
                      onChange={(e) =>
                        setFinanceForm({
                          ...financeForm,
                          monthlyGoal: Number(e.target.value),
                        })
                      }
                      className="w-full p-2.5 border border-[var(--card-border)] rounded-xl text-sm bg-[var(--background)]"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="flex items-center justify-center gap-2 bg-[var(--primary)] text-white px-6 py-3 rounded-xl font-bold text-sm shadow-sm cursor-pointer w-full sm:w-auto"
                >
                  <Save size={18} />
                  Salvar Configurações Financeiras
                </button>
              </form>
            )}

            {/* TAB: BOOKING LINK */}
            {activeTab === "booking" && (
              <div className="max-w-xl space-y-4">
                <h3 className="text-xl font-bold text-[var(--foreground)]">
                  Link Público de Agendamento Online
                </h3>
                <p className="text-sm text-[var(--muted)]">
                  Coloque este link na bio do Instagram e no WhatsApp. Suas clientes escolhem o serviço, a profissional e reservam apenas horários livres em tempo real.
                </p>
                <div className="flex flex-col sm:flex-row gap-3">
                  <input
                    type="text"
                    readOnly
                    value={bookingUrl}
                    className="flex-1 p-3 border border-[var(--card-border)] rounded-xl text-sm bg-[var(--background)]"
                  />
                  <button
                    type="button"
                    onClick={copyLink}
                    className="flex items-center justify-center gap-2 bg-[var(--primary)] text-white px-6 py-3 rounded-xl font-bold text-sm cursor-pointer"
                  >
                    {copied ? <Check size={18} /> : <Copy size={18} />}
                    {copied ? "Copiado!" : "Copiar Link"}
                  </button>
                </div>
              </div>
            )}

            {/* TAB: NOTIFICATIONS */}
            {activeTab === "notifications" && (
              <div className="max-w-xl space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold text-[var(--foreground)]">
                    Central de Notificações
                  </h3>
                  {notifications.length > 0 && (
                    <button
                      onClick={clearNotifications}
                      className="text-xs font-bold text-[var(--primary)] hover:underline cursor-pointer"
                    >
                      Limpar todas
                    </button>
                  )}
                </div>
                {notifications.length === 0 ? (
                  <p className="text-sm text-[var(--muted)] py-8">
                    Nenhuma notificação pendente.
                  </p>
                ) : (
                  <div className="space-y-2.5">
                    {notifications.map((n) => (
                      <div
                        key={n.id}
                        onClick={() => markAsRead(n.id)}
                        className="p-4 rounded-xl border border-[var(--card-border)] bg-[var(--background)] cursor-pointer"
                      >
                        <p className="font-bold text-sm text-[var(--foreground)]">
                          {n.title}
                        </p>
                        <p className="text-xs text-[var(--muted)]">
                          {n.message}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* TAB: APPEARANCE (WORKING LIGHT/DARK) */}
            {activeTab === "appearance" && (
              <div className="max-w-xl space-y-6">
                <h3 className="text-xl font-bold text-[var(--foreground)]">
                  Aparência do Sistema (Modo Claro e Escuro)
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => handleThemeChange("light")}
                    className={`p-5 rounded-2xl border-2 flex flex-col items-center gap-3 cursor-pointer transition-all ${
                      themeMode !== "dark"
                        ? "border-[var(--primary)] bg-[var(--primary-light)]/30"
                        : "border-[var(--card-border)]"
                    }`}
                  >
                    <Sun size={28} className="text-amber-500" />
                    <span className="font-bold text-sm text-[var(--foreground)]">
                      Modo Claro Rosé (Padrão)
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleThemeChange("dark")}
                    className={`p-5 rounded-2xl border-2 flex flex-col items-center gap-3 cursor-pointer transition-all ${
                      themeMode === "dark"
                        ? "border-[var(--primary)] bg-[var(--primary-light)]/30"
                        : "border-[var(--card-border)]"
                    }`}
                  >
                    <Moon size={28} className="text-purple-400" />
                    <span className="font-bold text-sm text-[var(--foreground)]">
                      Modo Escuro Elegante (Ativo)
                    </span>
                  </button>
                </div>
              </div>
            )}

            {/* TAB: SECURITY */}
            {activeTab === "security" && (
              <div className="max-w-xl space-y-6">
                <h3 className="text-xl font-bold text-[var(--foreground)] flex items-center gap-2">
                  <Lock size={20} className="text-[var(--primary)]" />
                  Segurança da Conta & Senha
                </h3>

                <form onSubmit={handlePasswordUpdate} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold uppercase text-[var(--muted)] mb-1">
                      Nova Senha de Acesso (Mínimo 6 caracteres)
                    </label>
                    <input
                      type="password"
                      minLength={6}
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Digite a nova senha"
                      className="w-full p-3 rounded-xl border border-[var(--card-border)] bg-[var(--background)] text-sm"
                    />
                  </div>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <button
                      type="submit"
                      disabled={loading}
                      className="bg-[var(--primary)] text-white px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm cursor-pointer"
                    >
                      Atualizar Senha Agora
                    </button>
                    <button
                      type="button"
                      onClick={handleSendResetEmail}
                      className="border border-[var(--card-border)] bg-[var(--background)] px-5 py-2.5 rounded-xl font-semibold text-xs sm:text-sm cursor-pointer"
                    >
                      Enviar Link de Redefinição por E-mail
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* TAB: DATA & LGPD */}
            {activeTab === "data" && (
              <div className="max-w-xl space-y-4">
                <h3 className="text-xl font-bold text-[var(--foreground)]">
                  Privacidade, LGPD e Limpeza de Dados
                </h3>
                <p className="text-sm text-[var(--muted)]">
                  Todos os dados das suas clientes são isolados por salão (multi-tenant). Caso deseje reiniciar sua conta do zero, você pode limpar os cadastros abaixo.
                </p>
                {!confirmClear ? (
                  <button
                    type="button"
                    onClick={() => setConfirmClear(true)}
                    className="flex items-center gap-2 bg-rose-600 hover:bg-rose-700 text-white px-6 py-3 rounded-xl font-bold text-sm cursor-pointer"
                  >
                    <Trash2 size={18} />
                    Limpar Todos os Dados do Salão
                  </button>
                ) : (
                  <div className="space-y-3 p-4 rounded-2xl bg-rose-50 border border-rose-200">
                    <p className="text-rose-700 font-bold text-sm">
                      Confirma a exclusão permanente de clientes, agendamentos e serviços?
                    </p>
                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={() => {
                          clearAllData();
                          setConfirmClear(false);
                        }}
                        className="bg-rose-600 text-white px-4 py-2 rounded-xl text-xs font-bold cursor-pointer"
                      >
                        Sim, excluir tudo
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmClear(false)}
                        className="bg-white border px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer"
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
