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
    <header className="h-16 md:h-20 bg-[var(--card-bg)]/90 backdrop-blur-md border-b border-[var(--card-border)] flex items-center justify-between px-4 md:px-6 lg:px-10 sticky top-0 z-30">
      <div className="flex items-center gap-3 md:gap-4 min-w-0">
        <button
          onClick={toggle}
          className="md:hidden p-2 -ml-2 hover:bg-[var(--primary-light)] rounded-xl transition-colors text-[var(--foreground)] cursor-pointer"
          aria-label="Abrir menu"
        >
          <Menu size={22} />
        </button>
        <div className="min-w-0">
          <h1 className="text-lg md:text-2xl font-bold font-sans tracking-tight text-[var(--foreground)] truncate">
            {title}
          </h1>
          {profile?.salon_name && (
            <p className="text-xs text-[var(--primary)] font-semibold truncate hidden sm:block">
              {profile.salon_name}
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 md:gap-2.5 shrink-0">
        <button
          onClick={() => router.push("/agenda")}
          className="hidden sm:flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[var(--primary-light)] text-[var(--primary)] text-xs font-semibold hover:bg-[var(--primary-light-hover)] transition-colors cursor-pointer"
          title="Ir para Agenda"
        >
          <CalendarPlus size={15} />
          <span>Agendar</span>
        </button>

        <button
          onClick={() => router.push("/whatsapp")}
          className="hidden sm:flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[var(--background)] border border-[var(--card-border)] text-[var(--foreground)] text-xs font-semibold hover:border-[var(--primary)]/40 transition-colors cursor-pointer"
          title="Central WhatsApp"
        >
          <MessageCircle size={15} className="text-emerald-600" />
          <span>WhatsApp</span>
        </button>

        <button
          onClick={toggleTheme}
          className="w-9 h-9 md:w-10 md:h-10 flex items-center justify-center text-[var(--muted)] hover:text-[var(--primary)] hover:bg-[var(--primary-light)] rounded-full transition-colors cursor-pointer"
          title={isDark ? "Ativar Modo Claro" : "Ativar Modo Escuro"}
        >
          {isDark ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        <button
          className="relative w-9 h-9 md:w-10 md:h-10 flex items-center justify-center text-[var(--muted)] hover:text-[var(--primary)] hover:bg-[var(--primary-light)] rounded-full transition-colors cursor-pointer"
          onClick={() => router.push("/configuracoes")}
          title="Notificações"
        >
          <Bell size={18} />
          {unreadCount > 0 && (
            <span className="absolute top-2 right-2 w-2 h-2 bg-[var(--primary)] rounded-full"></span>
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
