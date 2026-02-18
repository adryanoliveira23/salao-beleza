"use client";

import React from "react";
import { CheckCircle2, Circle, ListTodo, ClipboardCheck } from "lucide-react";
import { Header } from "@/components/Header";
import { useFinance } from "@/contexts/FinanceContext";

export default function ChecklistPage() {
  const { checklist, toggleChecklistItem, resetDailyChecklist } = useFinance();

  const categories = [
    { id: "morning", name: "Início do Dia", icon: "☀️" },
    { id: "afternoon", name: "Tarde / Operacional", icon: "✂️" },
    { id: "evening", name: "Fechamento", icon: "🌙" },
    { id: "maintenance", name: "Manutenção & Limpeza", icon: "🧹" },
  ];

  const categoryItems = (catId: string) =>
    checklist.filter((item) => item.category === catId);

  const progress = Math.round(
    (checklist.filter((i) => i.completed).length / (checklist.length || 1)) *
      100,
  );

  return (
    <div className="flex flex-col h-full bg-[#f5f5f5]">
      <Header title="Checklist Diário" />

      <div className="flex-1 overflow-y-auto p-4 md:p-8">
        <div className="max-w-3xl mx-auto space-y-6">
          {/* Progress Card */}
          <div className="bg-[var(--primary)] text-white p-6 rounded-3xl shadow-lg flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="bg-white/20 p-3 rounded-2xl">
                <ClipboardCheck size={32} />
              </div>
              <div>
                <h2 className="text-xl font-bold">Progresso do Dia</h2>
                <p className="text-white/80 text-sm">
                  Organização é a alma do negócio
                </p>
              </div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold">{progress}%</div>
              <p className="text-[10px] uppercase tracking-wider opacity-70">
                Concluído
              </p>
            </div>
          </div>

          {/* Reset Button */}
          <div className="flex justify-end">
            <button
              onClick={resetDailyChecklist}
              className="text-gray-500 hover:text-[var(--primary)] text-sm font-medium flex items-center gap-1 transition-colors"
            >
              <ListTodo size={16} /> Resetar para amanhã
            </button>
          </div>

          {/* Categories */}
          {categories.map((cat) => {
            const items = categoryItems(cat.id);
            if (items.length === 0) return null;

            return (
              <div key={cat.id} className="space-y-3">
                <h3 className="text-gray-500 font-bold text-sm uppercase tracking-widest pl-2 flex items-center gap-2">
                  <span>{cat.icon}</span> {cat.name}
                </h3>
                <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                  <div className="divide-y divide-gray-50">
                    {items.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => toggleChecklistItem(item.id)}
                        className="w-full text-left p-5 flex items-center gap-4 hover:bg-gray-50 transition-colors group"
                      >
                        <div
                          className={`transition-colors ${item.completed ? "text-green-500" : "text-gray-300 group-hover:text-[var(--primary-light)]"}`}
                        >
                          {item.completed ? (
                            <CheckCircle2 size={24} />
                          ) : (
                            <Circle size={24} />
                          )}
                        </div>
                        <span
                          className={`font-medium transition-all ${item.completed ? "text-gray-400 line-through" : "text-gray-700"}`}
                        >
                          {item.text}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
