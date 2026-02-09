"use client";

import { useState, useRef, useEffect } from "react";
import { Bell, Menu, LogOut, User } from "lucide-react";
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
  const { user, profile, signOut } = useAuth();
  const { unreadCount } = useNotifications();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowProfileMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    setShowProfileMenu(false);
    await signOut();
  };

  const displayTitle = profile?.salon_name
    ? `${title} - ${profile.salon_name}`
    : title;

  return (
    <header className="h-16 md:h-20 bg-white/70 backdrop-blur-xl border-b border-[#FF6B9D]/10 flex items-center justify-between px-4 md:px-6 lg:px-10 shadow-sm sticky top-0 z-30">
      <div className="flex items-center gap-3 md:gap-4">
        <button
          onClick={toggle}
          className="md:hidden p-2 -ml-2 hover:bg-[#FF6B9D]/10 rounded-lg transition-colors text-[#2d1b2e]"
          aria-label="Abrir menu"
        >
          <Menu size={24} />
        </button>
        <h1 className="text-xl md:text-[26px] font-bold font-display text-[#2d1b2e] truncate max-w-[200px] md:max-w-[400px]">
          {displayTitle}
        </h1>
      </div>

      <div className="flex items-center gap-3 md:gap-5 shrink-0">
        <button
          className="relative w-9 h-9 md:w-10 md:h-10 flex items-center justify-center text-gray-500 hover:text-[#FF6B9D] hover:bg-[#FF6B9D]/10 rounded-full transition-colors"
          onClick={() => router.push("/configuracoes")}
        >
          <Bell size={18} className="md:w-5 md:h-5" />
          {unreadCount > 0 && (
            <span className="absolute top-1.5 right-1.5 md:top-2 md:right-2 w-2 h-2 md:w-2.5 md:h-2.5 bg-[#FF6B9D] rounded-full border-2 border-white"></span>
          )}
        </button>

        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="w-[36px] h-[36px] md:w-[42px] md:h-[42px] rounded-full bg-linear-to-br from-[#FF6B9D] to-[#C73866] flex items-center justify-center text-white font-semibold text-xs md:text-sm shadow-md hover:scale-105 transition-transform shrink-0"
            aria-label="Menu do perfil"
          >
            {profile?.name ? (
              profile.name.substring(0, 2).toUpperCase()
            ) : (
              <User size={18} />
            )}
          </button>

          {showProfileMenu && (
            <div className="absolute right-0 top-full mt-2 py-2 w-48 bg-white rounded-xl shadow-lg border border-[#FF6B9D]/10 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="px-4 py-3 border-b border-[#f0f0f0]">
                <p className="font-semibold text-[#2d1b2e] text-sm truncate">
                  {profile?.name || "Usuário"}
                </p>
                <p className="text-xs text-[#666] truncate">
                  {profile?.email || user?.email || ""}
                </p>
              </div>
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-3 text-left text-sm text-[#666] hover:bg-[#fff0f5] hover:text-[#FF6B9D] transition-colors"
              >
                <LogOut size={18} />
                Sair
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
