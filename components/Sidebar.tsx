"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Scissors,
  BarChart3,
  Calendar,
  Users,
  Package,
  User,
  Link2,
  Settings,
  X,
} from "lucide-react";
import { useSidebar } from "@/contexts/SidebarContext";

export function Sidebar() {
  const pathname = usePathname();
  const { isOpen, close } = useSidebar();

  const menuItems = [
    { name: "Dashboard", icon: BarChart3, path: "/dashboard" },
    { name: "Agenda", icon: Calendar, path: "/agenda" },
    { name: "Clientes", icon: Users, path: "/clientes" },
    { name: "Serviços", icon: Package, path: "/servicos" },
    { name: "Profissionais", icon: User, path: "/profissionais" },
    { name: "Link de Agendamento", icon: Link2, path: "/meu-link" },
  ];

  return (
    <>
      {/* Overlay em mobile quando sidebar aberta */}
      <div
        className="fixed inset-0 bg-black/50 z-40 md:hidden transition-opacity"
        style={{ opacity: isOpen ? 1 : 0, pointerEvents: isOpen ? "auto" : "none" }}
        onClick={close}
        aria-hidden="true"
      />
      <aside
        className={`w-[280px] max-w-[85vw] bg-gradient-to-b from-[#FF6B9D] to-[#C73866] text-white flex flex-col shadow-[4px_0_20px_rgba(255,107,157,0.3)] z-50 h-screen fixed left-0 top-0 transition-transform duration-300 ease-out
          ${isOpen ? "translate-x-0" : "-translate-x-full"} md:translate-x-0`}
      >
      <div className="flex items-center justify-between gap-3 p-4 md:p-8 border-b border-white/20">
        <div className="flex items-center gap-3">
          <Scissors size={28} className="md:w-8 md:h-8 shrink-0" />
          <span className="text-xl md:text-2xl font-bold font-serif">Agendly Glow</span>
        </div>
        <button
          onClick={close}
          className="md:hidden p-2 hover:bg-white/15 rounded-lg transition-colors"
          aria-label="Fechar menu"
        >
          <X size={24} />
        </button>
      </div>

      <nav className="flex-1 px-3 py-4 md:py-6 flex flex-col gap-2 overflow-y-auto">
        {menuItems.map((item) => {
          const isActive =
            pathname === item.path ||
            (item.path !== "/" && pathname.startsWith(item.path));
          return (
            <Link
              key={item.path}
              href={item.path}
              onClick={close}
              className={`flex items-center gap-3 px-4 md:px-5 py-3 md:py-3.5 rounded-xl transition-all duration-300 font-medium font-sans text-sm md:text-base
                ${
                  isActive
                    ? "bg-white text-[#FF6B9D] font-semibold shadow-lg translate-x-1"
                    : "text-white/85 hover:bg-white/15 hover:text-white hover:translate-x-1"
                }`}
            >
              <item.icon size={20} className="shrink-0" />
              {item.name}
            </Link>
          );
        })}
      </nav>

      <div className="p-3 border-t border-white/20">
        <Link
          href="/configuracoes"
          onClick={close}
          className="flex items-center gap-3 px-4 md:px-5 py-3 md:py-3.5 w-full text-white/85 hover:bg-white/15 hover:text-white rounded-xl transition-all duration-300 font-medium font-sans text-sm md:text-base"
        >
          <Settings size={20} className="shrink-0" />
          Configurações
        </Link>
      </div>
    </aside>
    </>
  );
}
