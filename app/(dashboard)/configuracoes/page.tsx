"use client";

export const dynamic = "force-dynamic";

import React, { useState, useEffect, useMemo } from "react";
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
  Building2,
  Zap,
  Wifi,
  Target,
  Plus,
  Minus,
  Sparkles,
  CheckCircle2,
  MapPin,
  Store,
  Phone,
  ExternalLink,
  Instagram,
} from "lucide-react";
import { Header } from "@/components/Header";
import { soundEffects } from "@/lib/soundEffects";
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
import { doc, updateDoc, collection, query, where, getDocs } from "firebase/firestore";
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

// Formatador de Telefone / WhatsApp: (11) 98765-4321
function formatPhone(val: string): string {
  const digits = (val || "").replace(/\D/g, "").slice(0, 11);
  if (!digits) return "";
  if (digits.length <= 2) return `(${digits}`;
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

// Formatador de CPF: 000.000.000-00
function formatCPF(val: string): string {
  const digits = (val || "").replace(/\D/g, "").slice(0, 11);
  if (!digits) return "";
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
  if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
}

// Formatador de CNPJ: 00.000.000/0001-00
function formatCNPJ(val: string): string {
  const digits = (val || "").replace(/\D/g, "").slice(0, 14);
  if (!digits) return "";
  if (digits.length <= 2) return digits;
  if (digits.length <= 5) return `${digits.slice(0, 2)}.${digits.slice(2)}`;
  if (digits.length <= 8) return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5)}`;
  if (digits.length <= 12) return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8)}`;
  return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8, 12)}-${digits.slice(12)}`;
}

// Higienizador de Instagram (@usuario)
function cleanInstagramHandle(val: string): string {
  let s = (val || "").trim();
  s = s.replace(/^(https?:\/\/)?(www\.)?instagram\.com\//i, "");
  s = s.replace(/^[@/]+/, "").split(/[?#]/)[0];
  return s.toLowerCase();
}

export default function Settings() {
  const [activeTab, setActiveTab] = useState("profile");
  const [copied, setCopied] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);
  const { clearAllData } = useSalonData();
  const { user, profile, themeMode, refreshProfile, updateProfileData } = useAuth();
  const { notifications, markAsRead, clearNotifications } = useNotifications();
  const { settings, updateSettings } = useFinance();

  const [docType, setDocType] = useState<"cnpj" | "cpf">("cnpj");
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
      const rawDoc = profile.cnpj || "";
      const digits = rawDoc.replace(/\D/g, "");
      const detectedDocType: "cnpj" | "cpf" =
        digits.length <= 11 && digits.length > 0 ? "cpf" : "cnpj";
      setDocType(detectedDocType);

      setFormData({
        name: profile.name || "",
        email: profile.email || "",
        phone: formatPhone(profile.phone || ""),
        salon_name: profile.salon_name || "",
        username: profile.username || "",
        avatar_url: profile.avatar_url || "",
        address: profile.address || "",
        instagram: cleanInstagramHandle(profile.instagram || ""),
        cnpj: detectedDocType === "cpf" ? formatCPF(rawDoc) : formatCNPJ(rawDoc),
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

  const totalFixedCosts = useMemo(() => {
    return (
      (financeForm.rentCost || 0) +
      (financeForm.energyCost || 0) +
      (financeForm.internetCost || 0) +
      (financeForm.systemCost || 0)
    );
  }, [financeForm]);

  const formatBRL = (val: number) => {
    return (val || 0).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  };

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
      ? `${window.location.origin}/agendamento${formData.username ? `/${formData.username}` : ""}`
      : "/agendamento";

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

    const cleanUsername = (formData.username || "")
      .trim()
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9_-]/g, "");

    if (cleanUsername) {
      if (cleanUsername.length < 3) {
        setMessage({
          type: "error",
          text: "O nome de usuário do link deve ter no mínimo 3 caracteres.",
        });
        setLoading(false);
        return;
      }

      // Validação de unicidade: nenhum outro salão pode ter o mesmo nome de usuário
      try {
        const qUser = query(
          collection(db, "profiles"),
          where("username", "==", cleanUsername),
        );
        const snapUser = await getDocs(qUser);
        const isTakenByAnother = snapUser.docs.some((d) => d.id !== user.uid);

        if (isTakenByAnother) {
          setMessage({
            type: "error",
            text: `O nome de usuário "@${cleanUsername}" já está em uso por outro salão. Escolha um nome exclusivo para seu salão.`,
          });
          setLoading(false);
          return;
        }
      } catch (err) {
        console.error("Erro ao verificar disponibilidade do nome de usuário:", err);
      }
    }

    const cleanInsta = cleanInstagramHandle(formData.instagram);
    const formattedPhone = formatPhone(formData.phone);
    const formattedDoc =
      docType === "cpf" ? formatCPF(formData.cnpj) : formatCNPJ(formData.cnpj);

    try {
      await updateProfileData({
        name: formData.name,
        email: formData.email,
        phone: formattedPhone,
        salon_name: formData.salon_name,
        username: cleanUsername,
        avatar_url: formData.avatar_url,
        address: formData.address,
        instagram: cleanInsta,
        cnpj: formattedDoc,
      });
      setFormData((prev) => ({
        ...prev,
        username: cleanUsername,
        phone: formattedPhone,
        instagram: cleanInsta,
        cnpj: formattedDoc,
      }));
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
                        placeholder="Ex: BellaMais Salão de Beleza"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold uppercase text-[var(--muted)] mb-1 flex items-center justify-between">
                        <span>Usuário para Link (@slug único)</span>
                        <span className="text-[10px] text-rose-600 dark:text-rose-400 font-semibold normal-case">
                          Exclusivo por salão
                        </span>
                      </label>
                      <input
                        type="text"
                        value={formData.username}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            username: e.target.value
                              .toLowerCase()
                              .replace(/[^a-z0-9_-]/g, ""),
                          })
                        }
                        className="w-full p-3 border border-[var(--card-border)] rounded-xl text-sm bg-[var(--background)] font-mono"
                        placeholder="studioglow"
                      />
                      <p className="text-[11px] text-[var(--muted)] mt-1.5 truncate">
                        Link público:{" "}
                        <strong className="text-[var(--primary)] font-mono font-bold">
                          {(typeof window !== "undefined"
                            ? window.location.origin
                            : "https://bellamais.com") +
                            `/agendamento/${formData.username || "seu-usuario"}`}
                        </strong>
                      </p>
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase text-[var(--muted)] mb-1 flex items-center justify-between">
                        <span className="flex items-center gap-1.5">
                          <Phone size={13} className="text-emerald-500" />
                          WhatsApp / Telefone Comercial
                        </span>
                        <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold normal-case">
                          Com DDD
                        </span>
                      </label>
                      <input
                        type="tel"
                        value={formData.phone}
                        maxLength={15}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            phone: formatPhone(e.target.value),
                          })
                        }
                        className="w-full p-3 border border-[var(--card-border)] rounded-xl text-sm bg-[var(--background)] font-mono text-[var(--foreground)] placeholder:text-[var(--muted)]/50 focus:border-rose-500 focus:ring-1 focus:ring-rose-500 outline-none transition-all"
                        placeholder="(11) 99999-9999"
                      />
                      <p className="text-[11px] text-[var(--muted)] mt-1.5">
                        Formata automaticamente com DDD: (00) 00000-0000.
                      </p>
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
                      <label className="block text-xs font-bold uppercase text-[var(--muted)] mb-1 flex items-center justify-between">
                        <span className="flex items-center gap-1.5">
                          <Instagram size={13} className="text-pink-500" />
                          Instagram do Salão
                        </span>
                        <span className="text-[10px] text-pink-600 dark:text-pink-400 font-semibold normal-case">
                          @ ou Link
                        </span>
                      </label>
                      <div className="relative flex items-center">
                        <span className="absolute left-3.5 text-xs font-bold text-[var(--muted)] select-none pointer-events-none">
                          @
                        </span>
                        <input
                          type="text"
                          value={formData.instagram}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              instagram: cleanInstagramHandle(e.target.value),
                            })
                          }
                          className="w-full pl-8 pr-3 py-3 border border-[var(--card-border)] rounded-xl text-sm bg-[var(--background)] font-mono text-[var(--foreground)] placeholder:text-[var(--muted)]/50 focus:border-rose-500 focus:ring-1 focus:ring-rose-500 outline-none transition-all"
                          placeholder="seustudio"
                        />
                      </div>
                      <div className="mt-1.5 text-[11px] text-[var(--muted)] truncate">
                        {formData.instagram ? (
                          <a
                            href={`https://instagram.com/${formData.instagram}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-pink-600 dark:text-pink-400 hover:underline font-semibold"
                          >
                            <span>instagram.com/{formData.instagram}</span>
                            <ExternalLink size={11} />
                          </a>
                        ) : (
                          "Digite apenas seu @ ou cole o link do perfil."
                        )}
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-xs font-bold uppercase text-[var(--muted)]">
                          {docType === "cpf"
                            ? "CPF do Responsável"
                            : "CNPJ da Empresa / MEI"}
                        </label>
                        <div className="inline-flex items-center p-0.5 rounded-lg bg-[var(--background)] border border-[var(--card-border)] text-xs font-semibold">
                          <button
                            type="button"
                            onClick={() => {
                              setDocType("cpf");
                              setFormData((prev) => ({
                                ...prev,
                                cnpj: formatCPF(prev.cnpj),
                              }));
                            }}
                            className={`px-2.5 py-0.5 rounded-md text-xs font-bold transition-all ${
                              docType === "cpf"
                                ? "bg-rose-500 text-white shadow-sm"
                                : "text-[var(--muted)] hover:text-[var(--foreground)]"
                            }`}
                          >
                            CPF
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setDocType("cnpj");
                              setFormData((prev) => ({
                                ...prev,
                                cnpj: formatCNPJ(prev.cnpj),
                              }));
                            }}
                            className={`px-2.5 py-0.5 rounded-md text-xs font-bold transition-all ${
                              docType === "cnpj"
                                ? "bg-rose-500 text-white shadow-sm"
                                : "text-[var(--muted)] hover:text-[var(--foreground)]"
                            }`}
                          >
                            CNPJ
                          </button>
                        </div>
                      </div>
                      <input
                        type="text"
                        value={formData.cnpj}
                        maxLength={docType === "cpf" ? 14 : 18}
                        onChange={(e) => {
                          const val = e.target.value;
                          const formatted =
                            docType === "cpf" ? formatCPF(val) : formatCNPJ(val);
                          setFormData({ ...formData, cnpj: formatted });
                        }}
                        className="w-full p-3 border border-[var(--card-border)] rounded-xl text-sm bg-[var(--background)] font-mono text-[var(--foreground)] placeholder:text-[var(--muted)]/50 focus:border-rose-500 focus:ring-1 focus:ring-rose-500 outline-none transition-all"
                        placeholder={
                          docType === "cpf"
                            ? "000.000.000-00"
                            : "00.000.000/0001-00"
                        }
                      />
                      <p className="text-[11px] text-[var(--muted)] mt-1.5">
                        {docType === "cpf"
                          ? "11 dígitos com pontuação automática (000.000.000-00)."
                          : "14 dígitos com pontuação automática (00.000.000/0001-00)."}
                      </p>
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

            {/* TAB: FINANCIAL - SIMPLES MVP */}
            {activeTab === "financial" && (
              <form onSubmit={handleSaveFinance} className="max-w-2xl space-y-6">
                <div>
                  <h3 className="text-xl font-bold text-zinc-900 dark:text-white">
                    Estrutura Financeira
                  </h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                    Preencha suas despesas básicas e a meta do salão para calibrar o sistema.
                  </p>
                </div>

                {/* Perfil do Salão - 3 Opções Simples */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                    Perfil do Bairro
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: "simples" as NeighborhoodType, label: "Popular" },
                      { id: "media" as NeighborhoodType, label: "Bairro Médio" },
                      { id: "rica" as NeighborhoodType, label: "Bairro Nobre" },
                    ].map((item) => {
                      const isSelected = financeForm.neighborhood === item.id;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => {
                            soundEffects.playPop();
                            setFinanceForm({ ...financeForm, neighborhood: item.id });
                          }}
                          className={`py-2.5 px-3 rounded-xl text-xs font-bold transition cursor-pointer border text-center ${
                            isSelected
                              ? "bg-rose-600 text-white border-rose-600 shadow-xs"
                              : "bg-zinc-50 dark:bg-white/5 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-white/10 hover:bg-zinc-100 dark:hover:bg-white/10"
                          }`}
                        >
                          {item.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Grid Limpo de Despesas e Capacidade */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Aluguel */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                      Aluguel do Salão
                    </label>
                    <div className="relative flex items-center">
                      <span className="absolute left-3.5 text-xs font-bold text-zinc-400">R$</span>
                      <input
                        type="text"
                        inputMode="numeric"
                        placeholder="0"
                        value={financeForm.rentCost ? financeForm.rentCost.toLocaleString("pt-BR") : ""}
                        onChange={(e) => {
                          const num = Number(e.target.value.replace(/\D/g, ""));
                          setFinanceForm({ ...financeForm, rentCost: num });
                        }}
                        className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-zinc-200 dark:border-white/10 bg-zinc-50 dark:bg-white/5 text-sm font-semibold text-zinc-900 dark:text-white outline-none focus:border-rose-500"
                      />
                    </div>
                  </div>

                  {/* Energia & Água */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                      Energia & Água
                    </label>
                    <div className="relative flex items-center">
                      <span className="absolute left-3.5 text-xs font-bold text-zinc-400">R$</span>
                      <input
                        type="text"
                        inputMode="numeric"
                        placeholder="0"
                        value={financeForm.energyCost ? financeForm.energyCost.toLocaleString("pt-BR") : ""}
                        onChange={(e) => {
                          const num = Number(e.target.value.replace(/\D/g, ""));
                          setFinanceForm({ ...financeForm, energyCost: num });
                        }}
                        className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-zinc-200 dark:border-white/10 bg-zinc-50 dark:bg-white/5 text-sm font-semibold text-zinc-900 dark:text-white outline-none focus:border-rose-500"
                      />
                    </div>
                  </div>

                  {/* Internet */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                      Internet & Telefone
                    </label>
                    <div className="relative flex items-center">
                      <span className="absolute left-3.5 text-xs font-bold text-zinc-400">R$</span>
                      <input
                        type="text"
                        inputMode="numeric"
                        placeholder="0"
                        value={financeForm.internetCost ? financeForm.internetCost.toLocaleString("pt-BR") : ""}
                        onChange={(e) => {
                          const num = Number(e.target.value.replace(/\D/g, ""));
                          setFinanceForm({ ...financeForm, internetCost: num });
                        }}
                        className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-zinc-200 dark:border-white/10 bg-zinc-50 dark:bg-white/5 text-sm font-semibold text-zinc-900 dark:text-white outline-none focus:border-rose-500"
                      />
                    </div>
                  </div>

                  {/* Cadeiras */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                      Cadeiras / Bancadas Ativas
                    </label>
                    <input
                      type="number"
                      min="1"
                      placeholder="1"
                      value={financeForm.chairs || 1}
                      onChange={(e) => {
                        const val = Math.max(1, Number(e.target.value));
                        setFinanceForm({ ...financeForm, chairs: val });
                      }}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 dark:border-white/10 bg-zinc-50 dark:bg-white/5 text-sm font-semibold text-zinc-900 dark:text-white outline-none focus:border-rose-500"
                    />
                  </div>
                </div>

                {/* Meta Mensal de Faturamento */}
                <div className="p-4 rounded-2xl bg-zinc-50/80 dark:bg-white/[0.03] border border-zinc-200/80 dark:border-white/10 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-zinc-800 dark:text-zinc-200">
                      Meta Mensal de Faturamento (R$)
                    </label>
                    <span className="text-[11px] font-bold text-zinc-500 dark:text-zinc-400">
                      Total Custos Fixos: <strong className="text-zinc-900 dark:text-white">R$ {totalFixedCosts.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</strong>
                    </span>
                  </div>

                  <div className="relative flex items-center">
                    <span className="absolute left-3.5 text-sm font-bold text-zinc-400">R$</span>
                    <input
                      type="text"
                      inputMode="numeric"
                      placeholder="Ex: 25.000"
                      value={financeForm.monthlyGoal ? financeForm.monthlyGoal.toLocaleString("pt-BR") : ""}
                      onChange={(e) => {
                        const num = Number(e.target.value.replace(/\D/g, ""));
                        setFinanceForm({ ...financeForm, monthlyGoal: num });
                      }}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-zinc-200 dark:border-white/10 bg-white dark:bg-[#12141c] text-base font-extrabold text-zinc-900 dark:text-white outline-none focus:border-rose-500 shadow-2xs"
                    />
                  </div>
                </div>

                {/* Botão de Salvar */}
                <div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-6 py-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-sm transition cursor-pointer active:scale-95 disabled:opacity-50"
                  >
                    Salvar Configurações Financeiras
                  </button>
                </div>
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
