"use client";

import React, { useEffect } from "react";
import { soundEffects } from "@/lib/soundEffects";

export function GlobalSoundProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  useEffect(() => {
    let lastPlayedAt = 0;

    const handleGlobalClick = (event: MouseEvent) => {
      // Ignora se estiver silenciado
      if (soundEffects.isMuted()) return;

      const target = event.target as HTMLElement | null;
      if (!target) return;

      // Não toca som para campos de texto digitáveis (inputs de texto, textareas)
      const isTextInput =
        target instanceof HTMLInputElement &&
        ["text", "email", "password", "number", "search", "tel", "url"].includes(
          target.type
        );
      if (isTextInput || target instanceof HTMLTextAreaElement) {
        return;
      }

      // Se o elemento ou qualquer elemento pai tiver data-no-sound="true", não toca som
      if (target.closest("[data-no-sound='true']")) return;

      // Localiza o elemento interativo mais próximo
      const interactive = target.closest<HTMLElement>(
        "button, a, [role='button'], input[type='checkbox'], input[type='radio'], [data-sound], [data-tab], summary"
      );
      if (!interactive) return;

      // Debounce suave para evitar sobreposição excessiva de cliques duplos rápidos
      const now = performance.now();
      if (now - lastPlayedAt < 65) return;
      lastPlayedAt = now;

      // Verifica se há som customizado especificado via data-sound
      const explicitSound = interactive.getAttribute("data-sound");
      if (explicitSound === "sparkle") {
        soundEffects.playSparkle();
        return;
      }
      if (explicitSound === "success") {
        soundEffects.playSuccess();
        return;
      }
      if (explicitSound === "pop") {
        soundEffects.playPop();
        return;
      }
      if (explicitSound === "chic") {
        soundEffects.playChicPop();
        return;
      }

      // Elementos que funcionam como abas, chips, filtros ou switches produzem som de pop
      const isTabOrFilter =
        interactive.getAttribute("role") === "tab" ||
        interactive.hasAttribute("data-tab") ||
        interactive.classList.contains("tab") ||
        interactive.closest("[role='tablist']") !== null ||
        interactive.getAttribute("aria-selected") !== null;

      if (isTabOrFilter) {
        soundEffects.playPop();
        return;
      }

      // Botões primários ou botões de confirmação / submit
      const isPrimary =
        interactive.classList.toString().includes("btnPrimary") ||
        interactive.classList.toString().includes("bg-[var(--primary)]") ||
        interactive.getAttribute("type") === "submit";

      if (isPrimary) {
        soundEffects.playClick();
        return;
      }

      // Som tátil suave padrão para todos os demais botões e links
      soundEffects.playClick();
    };

    window.addEventListener("click", handleGlobalClick, {
      capture: true,
      passive: true,
    });

    return () => {
      window.removeEventListener("click", handleGlobalClick, {
        capture: true,
      });
    };
  }, []);

  return <>{children}</>;
}
