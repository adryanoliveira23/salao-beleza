"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

interface SidebarContextType {
  isOpen: boolean;            // Estado do menu gaveta em mobile (<768px)
  isDesktopOpen: boolean;     // Estado da barra lateral em desktop (>=768px)
  toggle: () => void;         // Alterna mobile (<768px) ou desktop (>=768px)
  close: () => void;          // Fecha mobile ou desktop
  open: () => void;           // Abre mobile ou desktop
  closeMobile: () => void;    // Fecha APENAS gaveta mobile (usado ao navegar para NÃO fechar o desktop)
  toggleDesktop: () => void;
  closeDesktop: () => void;
  openDesktop: () => void;
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isDesktopOpen, setIsDesktopOpen] = useState(true);

  // Fecha o drawer mobile automaticamente quando a tela é redimensionada para desktop
  useEffect(() => {
    function handleResize() {
      if (window.innerWidth >= 768) {
        setIsOpen(false);
      }
    }
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const toggle = () => {
    if (typeof window !== "undefined" && window.innerWidth < 768) {
      setIsOpen((prev) => !prev);
    } else {
      setIsDesktopOpen((prev) => !prev);
    }
  };

  // Fecha explicitamente a barra lateral atual
  const close = () => {
    setIsOpen(false);
    if (typeof window !== "undefined" && window.innerWidth >= 768) {
      setIsDesktopOpen(false);
    }
  };

  // Fecha APENAS o drawer mobile ao navegar (o desktop permanece aberto!)
  const closeMobile = () => {
    setIsOpen(false);
  };

  const open = () => {
    if (typeof window !== "undefined" && window.innerWidth < 768) {
      setIsOpen(true);
    } else {
      setIsDesktopOpen(true);
    }
  };

  const toggleDesktop = () => setIsDesktopOpen((prev) => !prev);
  const closeDesktop = () => setIsDesktopOpen(false);
  const openDesktop = () => setIsDesktopOpen(true);

  return (
    <SidebarContext.Provider
      value={{
        isOpen,
        isDesktopOpen,
        toggle,
        close,
        open,
        closeMobile,
        toggleDesktop,
        closeDesktop,
        openDesktop,
      }}
    >
      {children}
    </SidebarContext.Provider>
  );
}

export function useSidebar() {
  const context = useContext(SidebarContext);
  if (context === undefined) {
    throw new Error("useSidebar must be used within a SidebarProvider");
  }
  return context;
}
