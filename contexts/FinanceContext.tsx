"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useMemo,
} from "react";
import { useSalonData } from "./SalonDataContext";
import { useAuth } from "./AuthContext";
import { db } from "@/app/lib/firebase";
import {
  doc,
  setDoc,
  onSnapshot,
  DocumentSnapshot,
  DocumentData,
} from "firebase/firestore";

export interface FixedCost {
  id: string;
  name: string;
  amount: number;
  dayDue: number;
  paid: boolean;
  category?: string;
}

export interface VariableCost {
  id: string;
  name: string;
  amount: number;
  date: string;
  category: "product" | "maintenance" | "marketing" | "tax" | "other";
  paid?: boolean;
}

export interface FinancialTransaction {
  id: string;
  type: "income" | "expense";
  description: string;
  category: string;
  amount: number;
  discount?: number;
  depositAmount?: number;
  paymentMethod: "pix" | "dinheiro" | "cartao_credito" | "cartao_debito" | "outro";
  status: "paid" | "pending" | "partial" | "refunded";
  date: string;
  dueDate?: string;
  professionalId?: string;
  professionalName?: string;
  clientName?: string;
  appointmentId?: string;
}

export interface DailyClosing {
  id: string;
  date: string;
  totalIncome: number;
  totalExpense: number;
  netBalance: number;
  byMethod: {
    pix: number;
    dinheiro: number;
    cartao_credito: number;
    cartao_debito: number;
    outro: number;
  };
  notes?: string;
  closedAt: string;
}

export type NeighborhoodType = "simples" | "media" | "rica";

export interface CustomFund {
  id: string;
  name: string;
  percentage: number;
  color: string;
  enabled: boolean;
}

export interface ChecklistItem {
  id: string;
  text: string;
  completed: boolean;
  category: "morning" | "afternoon" | "evening" | "maintenance";
}

export interface FinanceSettings {
  monthlyGoal: number;
  taxRate: number;
  cardFeeRate: number;
  reinvestmentRate: number;
  emergencyFundRate: number;
  ownerSalaryFixed: number;
  ownerSalaryPercent: number;
  chairs: number;
  neighborhood: NeighborhoodType;
  rentCost: number;
  energyCost: number;
  internetCost: number;
  systemCost: number;
  customFunds: CustomFund[];
}

export interface FinancialHealth {
  dailyRevenue: number;
  weeklyRevenue: number;
  monthlyRevenue: number;
  projectedRevenue: number;
  totalFixedCosts: number;
  totalVariableCosts: number;
  totalProductCosts: number;
  totalCommissionsPending: number;
  totalCommissionsPaid: number;
  estimatedNetProfit: number;
  expensesPaidToday: number;
  accountsReceivable: number;
  billsDueToday: number;
  billsDueThisWeek: number;
  safeToWithdraw: number;
  fundsAccumulated: Record<string, number>;
  dailyGoalStatus: "behind" | "on_track" | "ahead";
  gapToDailyGoal: number;
  averageTicket: number;
  previousMonthRevenue: number;
  growthGoalReached: boolean;
  targetDailyForNextMonth: number;
  mustSaveForFixedCosts: number;
  advice?: string;
  suggestedCombo?: {
    name: string;
    price: number;
    originalPrice: number;
  };
}

const DEFAULT_SETTINGS: FinanceSettings = {
  monthlyGoal: 20000,
  taxRate: 6,
  cardFeeRate: 2,
  reinvestmentRate: 10,
  emergencyFundRate: 5,
  ownerSalaryFixed: 3000,
  ownerSalaryPercent: 20,
  chairs: 2,
  neighborhood: "media",
  rentCost: 1500,
  energyCost: 300,
  internetCost: 100,
  systemCost: 50,
  customFunds: [
    {
      id: "emergency",
      name: "Fundo de Emergência",
      percentage: 5,
      color: "emerald",
      enabled: true,
    },
    {
      id: "maintenance",
      name: "Manutenção e Equipamentos",
      percentage: 10,
      color: "orange",
      enabled: true,
    },
  ],
};

const DEFAULT_CHECKLIST: ChecklistItem[] = [
  {
    id: "1",
    text: "Abrir o salão e ligar climatização/iluminação",
    completed: false,
    category: "morning",
  },
  {
    id: "2",
    text: "Verificar agenda do dia e confirmações do WhatsApp",
    completed: false,
    category: "morning",
  },
  {
    id: "3",
    text: "Organizar bancadas, toalhas e materiais esterilizados",
    completed: false,
    category: "morning",
  },
  {
    id: "4",
    text: "Higienização rápida entre atendimentos",
    completed: false,
    category: "maintenance",
  },
  {
    id: "5",
    text: "Repor produtos de uso frequente nas bancadas",
    completed: false,
    category: "afternoon",
  },
  {
    id: "6",
    text: "Fechar caixa diário e conferir Pix/Cartão/Dinheiro",
    completed: false,
    category: "evening",
  },
  {
    id: "7",
    text: "Limpeza geral e preparação para o dia seguinte",
    completed: false,
    category: "evening",
  },
];

interface FinanceContextType {
  settings: FinanceSettings;
  updateSettings: (settings: Partial<FinanceSettings>) => Promise<void>;
  fixedCosts: FixedCost[];
  addFixedCost: (cost: Omit<FixedCost, "id" | "paid">) => Promise<void>;
  deleteFixedCost: (id: string) => Promise<void>;
  toggleFixedCostPaid: (id: string, paid: boolean) => Promise<void>;
  variableCosts: VariableCost[];
  addVariableCost: (cost: Omit<VariableCost, "id">) => Promise<void>;
  deleteVariableCost: (id: string) => Promise<void>;
  transactions: FinancialTransaction[];
  addTransaction: (tx: Omit<FinancialTransaction, "id">) => Promise<void>;
  updateTransaction: (
    id: string,
    updates: Partial<FinancialTransaction>,
  ) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  dailyClosings: DailyClosing[];
  closeDailyCash: (closing: Omit<DailyClosing, "id" | "closedAt">) => Promise<void>;
  financialHealth: FinancialHealth;
  isLoading: boolean;
  addCustomFund: (fund: Omit<CustomFund, "id">) => Promise<void>;
  removeCustomFund: (id: string) => Promise<void>;
  updateCustomFund: (id: string, updates: Partial<CustomFund>) => Promise<void>;
  checklist: ChecklistItem[];
  toggleChecklistItem: (id: string) => Promise<void>;
  addChecklistItem: (
    text: string,
    category: ChecklistItem["category"],
  ) => Promise<void>;
  deleteChecklistItem: (id: string) => Promise<void>;
  resetDailyChecklist: () => Promise<void>;
}

const FinanceContext = createContext<FinanceContextType | undefined>(undefined);

export function FinanceProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const { appointments, services, professionals } = useSalonData();

  const [settings, setSettings] = useState<FinanceSettings>(DEFAULT_SETTINGS);
  const [fixedCosts, setFixedCosts] = useState<FixedCost[]>([]);
  const [variableCosts, setVariableCosts] = useState<VariableCost[]>([]);
  const [transactions, setTransactions] = useState<FinancialTransaction[]>([]);
  const [dailyClosings, setDailyClosings] = useState<DailyClosing[]>([]);
  const [checklist, setChecklist] = useState<ChecklistItem[]>(DEFAULT_CHECKLIST);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setSettings(DEFAULT_SETTINGS);
      setFixedCosts([]);
      setVariableCosts([]);
      setTransactions([]);
      setDailyClosings([]);
      setChecklist(DEFAULT_CHECKLIST);
      setIsLoading(false);
      return;
    }

    const docRef = doc(db, "salon_finance", user.uid);
    const unsubscribe = onSnapshot(
      docRef,
      (docSnap: DocumentSnapshot<DocumentData>) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          setSettings({ ...DEFAULT_SETTINGS, ...data.settings });
          setFixedCosts(data.fixedCosts || []);
          setVariableCosts(data.variableCosts || []);
          setTransactions(data.transactions || []);
          setDailyClosings(data.dailyClosings || []);
          setChecklist(data.checklist || DEFAULT_CHECKLIST);
        } else {
          setDoc(docRef, {
            settings: DEFAULT_SETTINGS,
            fixedCosts: [],
            variableCosts: [],
            transactions: [],
            dailyClosings: [],
            checklist: DEFAULT_CHECKLIST,
          }).catch(() => {});
        }
        setIsLoading(false);
      },
      (err) => {
        if (err?.code !== "permission-denied") {
          console.warn("FinanceContext snapshot notice:", err);
        }
        setIsLoading(false);
      },
    );

    return () => unsubscribe();
  }, [user]);

  const saveToFirestore = async (
    data: Partial<{
      settings: FinanceSettings;
      fixedCosts: FixedCost[];
      variableCosts: VariableCost[];
      transactions: FinancialTransaction[];
      dailyClosings: DailyClosing[];
      checklist: ChecklistItem[];
    }>,
  ) => {
    if (!user) return;
    const docRef = doc(db, "salon_finance", user.uid);
    await setDoc(docRef, data, { merge: true });
  };

  const updateSettings = async (newSettings: Partial<FinanceSettings>) => {
    const updated = { ...settings, ...newSettings };
    setSettings(updated);
    await saveToFirestore({ settings: updated });
  };

  const addFixedCost = async (cost: Omit<FixedCost, "id" | "paid">) => {
    const newCost: FixedCost = {
      ...cost,
      id: crypto.randomUUID(),
      paid: false,
    };
    const updated = [...fixedCosts, newCost];
    setFixedCosts(updated);
    await saveToFirestore({ fixedCosts: updated });
  };

  const deleteFixedCost = async (id: string) => {
    const updated = fixedCosts.filter((c) => c.id !== id);
    setFixedCosts(updated);
    await saveToFirestore({ fixedCosts: updated });
  };

  const toggleFixedCostPaid = async (id: string, paid: boolean) => {
    const updated = fixedCosts.map((c) => (c.id === id ? { ...c, paid } : c));
    setFixedCosts(updated);
    await saveToFirestore({ fixedCosts: updated });
  };

  const addVariableCost = async (cost: Omit<VariableCost, "id">) => {
    const newCost: VariableCost = {
      ...cost,
      id: crypto.randomUUID(),
    };
    const updated = [newCost, ...variableCosts];
    setVariableCosts(updated);
    await saveToFirestore({ variableCosts: updated });
  };

  const deleteVariableCost = async (id: string) => {
    const updated = variableCosts.filter((c) => c.id !== id);
    setVariableCosts(updated);
    await saveToFirestore({ variableCosts: updated });
  };

  const addTransaction = async (tx: Omit<FinancialTransaction, "id">) => {
    const newTx: FinancialTransaction = {
      ...tx,
      id: crypto.randomUUID(),
    };
    const updated = [newTx, ...transactions];
    setTransactions(updated);
    await saveToFirestore({ transactions: updated });
  };

  const updateTransaction = async (
    id: string,
    updates: Partial<FinancialTransaction>,
  ) => {
    const updated = transactions.map((t) =>
      t.id === id ? { ...t, ...updates } : t,
    );
    setTransactions(updated);
    await saveToFirestore({ transactions: updated });
  };

  const deleteTransaction = async (id: string) => {
    const updated = transactions.filter((t) => t.id !== id);
    setTransactions(updated);
    await saveToFirestore({ transactions: updated });
  };

  const closeDailyCash = async (
    closing: Omit<DailyClosing, "id" | "closedAt">,
  ) => {
    const newClosing: DailyClosing = {
      ...closing,
      id: crypto.randomUUID(),
      closedAt: new Date().toISOString(),
    };
    const filtered = dailyClosings.filter((c) => c.date !== closing.date);
    const updated = [newClosing, ...filtered];
    setDailyClosings(updated);
    await saveToFirestore({ dailyClosings: updated });
  };

  const addCustomFund = async (fund: Omit<CustomFund, "id">) => {
    const newFund = { ...fund, id: crypto.randomUUID() };
    const updatedFunds = [...(settings.customFunds || []), newFund];
    await updateSettings({ customFunds: updatedFunds });
  };

  const removeCustomFund = async (id: string) => {
    const updatedFunds = settings.customFunds.filter((f) => f.id !== id);
    await updateSettings({ customFunds: updatedFunds });
  };

  const updateCustomFund = async (id: string, updates: Partial<CustomFund>) => {
    const updatedFunds = settings.customFunds.map((f) =>
      f.id === id ? { ...f, ...updates } : f,
    );
    await updateSettings({ customFunds: updatedFunds });
  };

  const toggleChecklistItem = async (id: string) => {
    const updated = checklist.map((item) =>
      item.id === id ? { ...item, completed: !item.completed } : item,
    );
    setChecklist(updated);
    await saveToFirestore({ checklist: updated });
  };

  const addChecklistItem = async (
    text: string,
    category: ChecklistItem["category"],
  ) => {
    const newItem: ChecklistItem = {
      id: crypto.randomUUID(),
      text,
      completed: false,
      category,
    };
    const updated = [...checklist, newItem];
    setChecklist(updated);
    await saveToFirestore({ checklist: updated });
  };

  const deleteChecklistItem = async (id: string) => {
    const updated = checklist.filter((i) => i.id !== id);
    setChecklist(updated);
    await saveToFirestore({ checklist: updated });
  };

  const resetDailyChecklist = async () => {
    const updated = checklist.map((item) => ({ ...item, completed: false }));
    setChecklist(updated);
    await saveToFirestore({ checklist: updated });
  };

  const financialHealth = useMemo(() => {
    const now = new Date();
    const today = now.toISOString().split("T")[0];
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    // Start of week (last 7 days)
    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(now.getDate() - 7);
    const sevenDaysAgoStr = sevenDaysAgo.toISOString().split("T")[0];

    let dailyRevenue = 0;
    let weeklyRevenue = 0;
    let monthlyRevenue = 0;
    let totalAppointmentsCount = 0;
    let totalProductCosts = 0;
    let totalCommissionsPending = 0;
    let totalCommissionsPaid = 0;
    let accountsReceivable = 0;

    appointments.forEach((apt) => {
      if (apt.status === "cancelled" || apt.status === "no_show") return;
      const netPrice = Math.max(0, apt.price - (apt.discount || 0));
      const [y, m] = (apt.date || "").split("-").map(Number);

      const isCurrentMonth =
        y === currentYear && m - 1 === currentMonth;

      const isRealized =
        apt.status === "confirmed" || apt.status === "completed";

      if (apt.date === today && isRealized) {
        dailyRevenue += netPrice;
      }
      if (apt.date >= sevenDaysAgoStr && apt.date <= today && isRealized) {
        weeklyRevenue += netPrice;
      }
      if (isCurrentMonth && isRealized) {
        monthlyRevenue += netPrice;
        totalAppointmentsCount++;

        const srv = services.find((s) => s.id === apt.serviceId);
        if (srv?.costPrice) {
          totalProductCosts += srv.costPrice;
        }

        const prof = professionals.find((p) => p.id === apt.professionalId);
        const commRate =
          srv?.commissionRate !== undefined && srv?.commissionRate !== null
            ? srv.commissionRate
            : prof?.commission || 0;
        const commAmount = netPrice * (commRate / 100);

        if (apt.commissionPaid) {
          totalCommissionsPaid += commAmount;
        } else {
          totalCommissionsPending += commAmount;
        }
      }

      if (apt.paymentStatus === "pending" || apt.paymentStatus === "partial") {
        const remaining = Math.max(0, netPrice - (apt.depositAmount || 0));
        accountsReceivable += remaining;
      }
    });

    // Also include manual transactions
    let manualExpensesToday = 0;
    let manualExpensesMonth = 0;

    transactions.forEach((tx) => {
      if (tx.status === "refunded") return;
      const [y, m] = (tx.date || "").split("-").map(Number);
      const isCurrentMonth = y === currentYear && m - 1 === currentMonth;
      const netAmount = Math.max(0, tx.amount - (tx.discount || 0));

      if (tx.type === "income") {
        if (tx.status === "paid") {
          if (tx.date === today) dailyRevenue += netAmount;
          if (tx.date >= sevenDaysAgoStr && tx.date <= today)
            weeklyRevenue += netAmount;
          if (isCurrentMonth) monthlyRevenue += netAmount;
        } else if (tx.status === "pending" || tx.status === "partial") {
          accountsReceivable += Math.max(0, netAmount - (tx.depositAmount || 0));
        }
      } else if (tx.type === "expense") {
        if (tx.status === "paid" && tx.date === today) {
          manualExpensesToday += netAmount;
        }
        if (isCurrentMonth) {
          manualExpensesMonth += netAmount;
        }
      }
    });

    const totalFixedCosts = fixedCosts.reduce((acc, c) => acc + c.amount, 0);
    const totalVariableCosts =
      variableCosts.reduce((acc, c) => acc + c.amount, 0) + manualExpensesMonth;

    const todayDay = Math.max(1, now.getDate());
    const variablePaidToday = variableCosts
      .filter((c) => c.date === today)
      .reduce((acc, c) => acc + c.amount, 0);
    const fixedPaidToday = fixedCosts
      .filter((c) => c.paid && c.dayDue === todayDay)
      .reduce((acc, c) => acc + c.amount, 0);
    const expensesPaidToday =
      manualExpensesToday + variablePaidToday + fixedPaidToday;

    const billsDueToday = fixedCosts
      .filter((c) => c.dayDue === todayDay && !c.paid)
      .reduce((acc, c) => acc + c.amount, 0);

    const endOfWeek = new Date(now);
    endOfWeek.setDate(now.getDate() + 7);
    const billsDueThisWeek = fixedCosts
      .filter((c) => {
        const isDue = c.dayDue >= todayDay && c.dayDue <= endOfWeek.getDate();
        return isDue && !c.paid;
      })
      .reduce((acc, c) => acc + c.amount, 0);

    const fundsAccumulated: Record<string, number> = {};
    let totalFundsAllocation = 0;
    const effectiveFunds = settings.customFunds || DEFAULT_SETTINGS.customFunds;

    effectiveFunds.forEach((fund) => {
      if (fund.enabled) {
        const amount = monthlyRevenue * (fund.percentage / 100);
        fundsAccumulated[fund.id] = amount;
        totalFundsAllocation += amount;
      }
    });

    const taxAllocation = monthlyRevenue * (settings.taxRate / 100);
    const cardFees = monthlyRevenue * (settings.cardFeeRate / 100);

    // Real Estimated Net Profit (Revenue - Fixed Costs - Variable Costs - Product Costs - Commissions - Taxes/Fees)
    const estimatedNetProfit =
      monthlyRevenue -
      totalFixedCosts -
      totalVariableCosts -
      totalProductCosts -
      (totalCommissionsPending + totalCommissionsPaid) -
      taxAllocation -
      cardFees;

    const netOperatingIncome =
      monthlyRevenue -
      (taxAllocation +
        cardFees +
        totalFundsAllocation +
        totalVariableCosts +
        totalProductCosts +
        (totalCommissionsPending + totalCommissionsPaid) +
        (totalFixedCosts / 30) * todayDay);

    const safeToWithdraw = Math.max(
      0,
      netOperatingIncome * (settings.ownerSalaryPercent / 100),
    );

    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const dailyGoalTarget = settings.monthlyGoal / daysInMonth;
    const gapToDailyGoal = dailyGoalTarget - dailyRevenue;
    const dailyGoalStatus = (
      gapToDailyGoal <= 0
        ? "ahead"
        : gapToDailyGoal < dailyGoalTarget * 0.2
          ? "on_track"
          : "behind"
    ) as "ahead" | "on_track" | "behind";

    const averageTicket =
      totalAppointmentsCount > 0 ? monthlyRevenue / totalAppointmentsCount : 0;
    const projectedRevenue = (monthlyRevenue / todayDay) * daysInMonth;

    let advice = "";
    let suggestedCombo = undefined;

    if (gapToDailyGoal > 0) {
      const highValueServices = services
        .filter((s) => s.price >= 50)
        .sort((a, b) => b.price - a.price);

      if (highValueServices.length > 0) {
        const mainService = highValueServices[0];
        const secondaryService =
          services.find(
            (s) => s.id !== mainService.id && s.price < mainService.price,
          ) || mainService;

        const originalPrice =
          mainService.price +
          (mainService.id !== secondaryService.id ? secondaryService.price : 0);
        const discountPrice = originalPrice * 0.86;

        advice = `Faltam R$ ${gapToDailyGoal.toFixed(2)} para a meta de hoje. Sugiro divulgar uma oferta de ${mainService.name} + ${secondaryService.name} pelo WhatsApp.`;
        suggestedCombo = {
          name: `Combo ${mainService.name} + ${secondaryService.name}`,
          price: discountPrice,
          originalPrice: originalPrice,
        };
      } else {
        advice =
          "Cadastre seus serviços e combos no catálogo para receber recomendações personalizadas de vendas.";
      }
    } else {
      const neighborhoodMultipliers = {
        simples: 80,
        media: 120,
        rica: 200,
      };
      const flavor =
        settings?.neighborhood as keyof typeof neighborhoodMultipliers;
      const targetTicket = neighborhoodMultipliers[flavor] || 100;

      if (averageTicket < targetTicket && averageTicket > 0) {
        advice = `Meta diária batida! Seu ticket médio atual é R$ ${averageTicket.toFixed(2)}. Criar pacotes com hidratação ou design pode elevar seu ticket para R$ ${targetTicket}.`;
      } else {
        advice =
          "Excelente desempenho! Meta batida e margem saudável. Aproveite para fidelizar as clientes atendidas hoje.";
      }
    }

    const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const yearOfLastMonth = currentMonth === 0 ? currentYear - 1 : currentYear;

    let previousMonthRevenue = 0;
    appointments.forEach((apt) => {
      const [y, m] = (apt.date || "").split("-").map(Number);
      if (
        m - 1 === lastMonth &&
        y === yearOfLastMonth &&
        (apt.status === "confirmed" || apt.status === "completed")
      ) {
        previousMonthRevenue += Math.max(0, apt.price - (apt.discount || 0));
      }
    });

    const growthGoalReached =
      previousMonthRevenue > 0
        ? monthlyRevenue >= previousMonthRevenue * 1.2
        : monthlyRevenue >= settings.monthlyGoal;

    const targetDailyForNextMonth =
      previousMonthRevenue > 0
        ? (previousMonthRevenue * 1.2) / 30
        : settings.monthlyGoal / 30;

    const mustSaveForFixedCosts = fixedCosts
      .filter((c) => !c.paid)
      .reduce((acc, c) => acc + c.amount, 0);

    return {
      dailyRevenue,
      weeklyRevenue,
      monthlyRevenue,
      projectedRevenue,
      totalFixedCosts,
      totalVariableCosts,
      totalProductCosts,
      totalCommissionsPending,
      totalCommissionsPaid,
      estimatedNetProfit,
      expensesPaidToday,
      accountsReceivable,
      billsDueToday,
      billsDueThisWeek,
      safeToWithdraw,
      fundsAccumulated,
      dailyGoalStatus,
      gapToDailyGoal,
      averageTicket,
      previousMonthRevenue,
      growthGoalReached,
      targetDailyForNextMonth,
      mustSaveForFixedCosts,
      advice,
      suggestedCombo,
    };
  }, [
    appointments,
    services,
    professionals,
    fixedCosts,
    variableCosts,
    transactions,
    settings,
  ]);

  const value: FinanceContextType = {
    settings,
    updateSettings,
    fixedCosts,
    addFixedCost,
    deleteFixedCost,
    toggleFixedCostPaid,
    variableCosts,
    addVariableCost,
    deleteVariableCost,
    transactions,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    dailyClosings,
    closeDailyCash,
    financialHealth,
    isLoading,
    addCustomFund,
    removeCustomFund,
    updateCustomFund,
    checklist,
    toggleChecklistItem,
    addChecklistItem,
    deleteChecklistItem,
    resetDailyChecklist,
  };

  return (
    <FinanceContext.Provider value={value}>{children}</FinanceContext.Provider>
  );
}

export function useFinance() {
  const context = useContext(FinanceContext);
  if (context === undefined) {
    throw new Error("useFinance must be used within a FinanceProvider");
  }
  return context;
}
