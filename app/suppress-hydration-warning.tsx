"use client";

import { useEffect } from "react";

/**
 * Componente para suprimir warnings de hidratação causados por extensões do navegador
 * que adicionam atributos ao DOM antes do React hidratar
 */
export function SuppressHydrationWarning() {
  useEffect(() => {
    // Remover atributos adicionados por extensões do navegador após a hidratação
    const removeExtensionAttributes = () => {
      if (typeof document !== "undefined" && document.body) {
        const body = document.body;
        // Lista de atributos comuns adicionados por extensões
        const extensionAttributes = [
          "cz-shortcut-listen",
          "data-new-gr-c-s-check-loaded",
          "data-gr-ext-installed",
        ];
        
        extensionAttributes.forEach((attr) => {
          if (body.hasAttribute(attr)) {
            body.removeAttribute(attr);
          }
        });
      }
    };

    // Executar imediatamente e após um pequeno delay para garantir
    removeExtensionAttributes();
    const timeout = setTimeout(removeExtensionAttributes, 0);
    
    return () => clearTimeout(timeout);
  }, []);

  return null;
}
