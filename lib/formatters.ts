/**
 * Utilitários de Formatação para Moeda Brasileira (BRL) e Dados Comerciais
 */

// Formata número como Real Brasileiro (Ex: 150.5 -> "R$ 150,50")
export function formatBRL(value: number | string | undefined | null): string {
  const num = typeof value === "number" ? value : Number(value) || 0;
  return num.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

// Converte texto digitado com máscara para número float real (Ex: "R$ 150,50" -> 150.50)
export function parseBRL(value: string | number | undefined | null): number {
  if (typeof value === "number") return isNaN(value) ? 0 : value;
  if (!value) return 0;
  const digits = String(value).replace(/\D/g, "");
  if (!digits) return 0;
  return Number(digits) / 100;
}

// Aplica máscara contínua enquanto o usuário digita (estilo caixa eletrônico / máquina de cartão)
export function maskBRLInput(value: string | number): string {
  const num = parseBRL(value);
  return formatBRL(num);
}
