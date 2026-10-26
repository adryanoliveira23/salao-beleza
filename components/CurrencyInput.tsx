"use client";

import React from "react";
import { formatBRL } from "@/lib/formatters";

export interface CurrencyInputProps
  extends Omit<
    React.InputHTMLAttributes<HTMLInputElement>,
    "onChange" | "value"
  > {
  value: number;
  onChangeValue: (val: number) => void;
  className?: string;
  placeholder?: string;
}

/**
 * Input Especializado em Moeda Brasileira (Real / BRL)
 * - Digitação estilo máquina de cartão / ATM (da direita para esquerda)
 * - Retorna sempre um número float real no callback `onChangeValue(num)`
 * - 100% livre de bugs com separador de decimal (. ou ,)
 */
export function CurrencyInput({
  value,
  onChangeValue,
  className = "",
  placeholder = "R$ 0,00",
  disabled = false,
  ...props
}: CurrencyInputProps) {
  const displayValue = formatBRL(value || 0);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, "");
    const numeric = raw ? Number(raw) / 100 : 0;
    onChangeValue(numeric);
  };

  return (
    <input
      type="text"
      inputMode="numeric"
      value={displayValue}
      onChange={handleChange}
      placeholder={placeholder}
      disabled={disabled}
      className={`font-mono ${className}`}
      {...props}
    />
  );
}
