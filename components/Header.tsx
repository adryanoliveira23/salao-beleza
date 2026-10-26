"use client";

import { useState, useRef, useEffect } from "react";
import {
  Bell,
  Menu,
  LogOut,
  User,
  Moon,
  Sun,
  CalendarPlus,
  MessageCircle,
  Settings,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useSidebar } from "@/contexts/SidebarContext";
import { useAuth } from "@/contexts/AuthContext";
import { useNotifications } from "@/contexts/NotificationContext";

interface HeaderProps {
  title: string;
}

export function Header({ title }: HeaderProps) {
  const { toggle } = useSidebar();
  const router = useRouter();
  const { user, profile, themeMode, signOut, toggleThemeMode } = useAuth();
  const { unreadCount } = useNotifications();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const isDark = themeMode === "dark";

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowProfileMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleTheme = async () => {
    await toggleThemeMode();
  };

  const handleLogout = async () => {
    setShowProfileMenu(false);
    await signOut();
  };

  return (
    <header className="h-16 bg-[var(--card-bg)] border-b border-[var(--card-border)] flex items-center justify-between px-4 md:px-6 lg:px-8 sticky top-0 z-30">
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={toggle}
          className="md:hidden p-2 -ml-2 hover:bg-stone-100 dark:hover:bg-zinc-800 rounded-lg transition-colors text-[var(--foreground)] cursor-pointer"
          aria-label="Abrir menu"
        >
          <Menu size={20} />
        </button>
        <div className="min-w-0">
          <div className="flex items-center gap-2.5">
            <h1 className="text-base md:text-lg font-bold tracking-tight text-[var(--foreground)] truncate">
              {title}
            </h1>
            {profile?.salon_name && (
              <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-stone-100 dark:bg-white/[0.06] text-[var(--muted)] dark:text-rose-100/80 text-[11px] font-medium border border-stone-200 dark:border-white/10">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                {profile.salon_name}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={() => router.push("/agenda")}
          className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-stone-200 dark:border-white/10 bg-transparent dark:bg-white/[0.04] hover:bg-stone-50 dark:hover:bg-white/[0.08] text-stone-700 dark:text-zinc-200 text-xs font-semibold transition-all cursor-pointer shadow-2xs"
          title="Ir para Agenda"
        >
          <CalendarPlus size={14} className="text-[var(--primary)] dark:text-rose-400" />
          <span>Agenda</span>
        </button>

        <button
          onClick={() => router.push("/whatsapp")}
          className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-stone-200 dark:border-white/10 bg-transparent dark:bg-white/[0.04] hover:bg-stone-50 dark:hover:bg-white/[0.08] text-stone-700 dark:text-zinc-200 text-xs font-semibold transition-all cursor-pointer shadow-2xs"
          title="Central WhatsApp"
        >
          <MessageCircle size={14} className="text-emerald-600 dark:text-emerald-400" />
          <span>WhatsApp</span>
        </button>

        <button
          onClick={toggleTheme}
          className="w-8 h-8 flex items-center justify-center text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-stone-100 dark:hover:bg-white/[0.06] rounded-xl transition-all cursor-pointer"
          title={isDark ? "Ativar Modo Claro" : "Ativar Modo Escuro"}
        >
          {isDark ? <Sun size={16} /> : <Moon size={16} />}
        </button>

        <button
          className="relative w-8 h-8 flex items-center justify-center text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-stone-100 dark:hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer"
          onClick={() => router.push("/configuracoes")}
          title="Notificações"
        >
          <Bell size={16} />
          {unreadCount > 0 && (
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[var(--primary)] rounded-full"></span>
          )}
        </button>

        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="w-9 h-9 md:w-10 md:h-10 rounded-full bg-gradient-to-tr from-[var(--primary)] to-rose-300 p-[2px] shadow-2xs hover:opacity-95 transition-opacity shrink-0 cursor-pointer relative"
            aria-label="Menu do perfil"
          >
            {profile?.avatar_url || user?.photoURL ? (
              <img
                src={profile?.avatar_url || user?.photoURL || ""}
                alt={profile?.name || "Usuário"}
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              <div className="w-full h-full rounded-full bg-[var(--card-bg)] text-[var(--primary)] flex items-center justify-center font-bold text-xs">
                {profile?.name ? (
                  profile.name.substring(0, 2).toUpperCase()
                ) : (
                  <User size={16} />
                )}
              </div>
            )}
            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-zinc-900" />
          </button>

          {showProfileMenu && (
            <div className="absolute right-0 top-full mt-2 py-2 w-56 bg-[var(--card-bg)] rounded-2xl shadow-xl border border-[var(--card-border)] z-50">
              <div className="px-4 py-3 border-b border-[var(--card-border)]">
                <p className="font-bold text-[var(--foreground)] text-sm truncate">
                  {profile?.name || "Profissional"}
                </p>
                <p className="text-xs text-[var(--muted)] truncate">
                  {profile?.email || user?.email || ""}
                </p>
                <span className="inline-block mt-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[var(--accent-gold-light)] text-[var(--accent-gold)]">
                  Plano {profile?.plan || "Profissional"}
                </span>
              </div>
              <button
                onClick={() => {
                  setShowProfileMenu(false);
                  router.push("/configuracoes");
                }}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-left text-sm text-[var(--muted)] hover:bg-[var(--primary-light)] hover:text-[var(--primary)] transition-colors cursor-pointer"
              >
                <Settings size={16} />
                Configurações
              </button>
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-left text-sm text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
              >
                <LogOut size={16} />
                Sair da conta
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
