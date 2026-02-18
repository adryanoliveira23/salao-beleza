"use client";

import React, { useState, useEffect } from "react";
import { Header } from "@/components/Header";
import { Plus, Trash2, CheckCircle, Circle, ArrowRight } from "lucide-react";

interface Task {
  id: string;
  text: string;
  completed: boolean;
  category: "morning" | "afternoon" | "evening" | "closing";
}

export default function ChecklistPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTask, setNewTask] = useState("");
  const [category, setCategory] = useState<Task["category"]>("morning");

  // Load from LocalStorage
  useEffect(() => {
    const saved = localStorage.getItem("salon_checklist");
    if (saved) {
      try {
        setTasks(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to load checklist", e);
      }
    } else {
      // Default initial tasks
      setTasks([
        {
          id: "1",
          text: "Abrir caixa e contar fundo de troco",
          completed: false,
          category: "morning",
        },
        {
          id: "2",
          text: "Verificar agendamentos do dia",
          completed: false,
          category: "morning",
        },
        {
          id: "3",
          text: "Limpar e organizar bancadas",
          completed: false,
          category: "morning",
        },
        {
          id: "4",
          text: "Confirmação de clientes de amanhã",
          completed: false,
          category: "afternoon",
        },
        {
          id: "5",
          text: "Fechar caixa e lançar despesas",
          completed: false,
          category: "closing",
        },
      ]);
    }
  }, []);

  // Save to LocalStorage
  useEffect(() => {
    if (tasks.length > 0) {
      localStorage.setItem("salon_checklist", JSON.stringify(tasks));
    }
  }, [tasks]);

  const addTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTask.trim()) return;

    const task: Task = {
      id: crypto.randomUUID(),
      text: newTask,
      completed: false,
      category,
    };

    setTasks([...tasks, task]);
    setNewTask("");
  };

  const toggleTask = (id: string) => {
    setTasks(
      tasks.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t)),
    );
  };

  const deleteTask = (id: string) => {
    setTasks(tasks.filter((t) => t.id !== id));
  };

  const resetDaily = () => {
    if (
      confirm("Deseja desmarcar todas as tarefas para iniciar um novo dia?")
    ) {
      setTasks(tasks.map((t) => ({ ...t, completed: false })));
    }
  };

  const progress =
    tasks.length > 0
      ? Math.round(
          (tasks.filter((t) => t.completed).length / tasks.length) * 100,
        )
      : 0;

  const categories = {
    morning: {
      label: "Abertura / Manhã",
      color: "text-orange-500",
      bg: "bg-orange-50",
    },
    afternoon: {
      label: "Tarde / Operacional",
      color: "text-blue-500",
      bg: "bg-blue-50",
    },
    evening: { label: "Noite", color: "text-indigo-500", bg: "bg-indigo-50" },
    closing: {
      label: "Fechamento",
      color: "text-purple-500",
      bg: "bg-purple-50",
    },
  };

  return (
    <div className="flex flex-col h-full bg-[#f5f5f5]">
      <Header title="Checklist Diário" />

      <div className="flex-1 overflow-y-auto p-4 md:p-8">
        <div className="max-w-3xl mx-auto">
          {/* Progress Card */}
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 mb-8 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-800">
                Progresso do Dia
              </h2>
              <p className="text-gray-500 text-sm">
                Organização é a chave do sucesso!
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <span className="text-3xl font-bold text-[var(--primary)]">
                  {progress}%
                </span>
                <p className="text-xs text-gray-400">Concluído</p>
              </div>
              <div className="w-16 h-16 rounded-full border-4 border-gray-100 flex items-center justify-center relative">
                <div
                  className="absolute inset-0 rounded-full border-4 border-[var(--primary)]"
                  style={{ clipPath: `inset(0 ${100 - progress}% 0 0)` }}
                ></div>
                <CheckCircle className="text-[var(--primary)]" />
              </div>
            </div>
          </div>

          {/* Add Task Form */}
          <form
            onSubmit={addTask}
            className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 mb-8 flex gap-3 flex-col md:flex-row"
          >
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as Task["category"])}
              className="bg-gray-50 border border-gray-200 rounded-xl p-3 outline-none focus:ring-2 focus:ring-[var(--primary)] text-sm font-medium text-gray-700"
            >
              <option value="morning">Manhã</option>
              <option value="afternoon">Tarde</option>
              <option value="evening">Noite</option>
              <option value="closing">Fechamento</option>
            </select>
            <input
              type="text"
              value={newTask}
              onChange={(e) => setNewTask(e.target.value)}
              placeholder="Adicionar nova tarefa..."
              className="flex-1 bg-gray-50 border border-gray-200 rounded-xl p-3 outline-none focus:ring-2 focus:ring-[var(--primary)]"
            />
            <button
              type="submit"
              disabled={!newTask.trim()}
              className="bg-[var(--primary)] text-white px-6 py-3 rounded-xl font-bold hover:bg-[var(--primary-dark)] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <Plus size={20} />
              Adicionar
            </button>
          </form>

          {/* Task Lists */}
          <div className="space-y-6">
            {(Object.keys(categories) as Array<keyof typeof categories>).map(
              (catKey) => {
                const catTasks = tasks.filter((t) => t.category === catKey);
                if (catTasks.length === 0) return null;

                const catConfig = categories[catKey];

                return (
                  <div
                    key={catKey}
                    className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100"
                  >
                    <h3
                      className={`font-bold text-lg mb-4 flex items-center gap-2 ${catConfig.color}`}
                    >
                      <span
                        className={`w-3 h-3 rounded-full ${catConfig.bg.replace("bg-", "bg-current ")}`}
                      ></span>
                      {catConfig.label}
                    </h3>

                    <div className="space-y-2">
                      {catTasks.map((task) => (
                        <div
                          key={task.id}
                          onClick={() => toggleTask(task.id)}
                          className={`group flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer ${task.completed ? "bg-gray-50 border-gray-100" : "bg-white border-gray-100 hover:border-[var(--primary)] hover:shadow-sm"}`}
                        >
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            {task.completed ? (
                              <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center text-white shrink-0">
                                <CheckCircle size={14} />
                              </div>
                            ) : (
                              <div className="w-6 h-6 rounded-full border-2 border-gray-300 group-hover:border-[var(--primary)] shrink-0"></div>
                            )}
                            <span
                              className={`truncate md:whitespace-normal md:break-words ${task.completed ? "text-gray-400 line-through" : "text-gray-700"}`}
                            >
                              {task.text}
                            </span>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteTask(task.id);
                            }}
                            className="p-2 text-gray-400 hover:text-red-500 transition-all shrink-0"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              },
            )}
          </div>

          <div className="mt-8 flex justify-center">
            <button
              onClick={resetDaily}
              className="text-gray-500 text-sm hover:text-[var(--primary)] underline"
            >
              Iniciar novo dia (Resetar tarefas)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
