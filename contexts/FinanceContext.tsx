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
  updateDoc,
  DocumentSnapshot,
  DocumentData,
} from "firebase/firestore";

// Types
export interface FixedCost {
  id: string;
  name: string; // e.g., Aluguel, Internet, Sistema
  amount: number;
  dayDue: number; // Day of month to pay
  paid: boolean;
}

export interface VariableCost {
  id: string;
  name: string; // e.g., Produtos, Manutenção
  amount: number;
  date: string;
  category: "product" | "maintenance" | "marketing" | "tax" | "other";
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
  taxRate: number; // % (e.g., 6% SIMPLES)
  cardFeeRate: number; // % average
  reinvestmentRate: number; // % for upgrades/depreciation -> Now mapped to 'Manutenção' fund default
  emergencyFundRate: number; // % for safety net -> Now mapped to 'Emergência' fund default
  ownerSalaryFixed: number; // Fixed draw
  ownerSalaryPercent: number; // % profit share
  // New Fields
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
  monthlyRevenue: number;
  projectedRevenue: number;
  totalFixedCosts: number;
  totalVariableCosts: number;
  billsDueToday: number;
  billsDueThisWeek: number;
  safeToWithdraw: number;
  // maintenanceFundAccumulated: number; // Deprecated, use funds map
  // emergencyFundAccumulated: number; // Deprecated, use funds map
  fundsAccumulated: Record<string, number>; // id -> amount
  dailyGoalStatus: "behind" | "on_track" | "ahead";
  gapToDailyGoal: number;
  averageTicket: number;
  // Growth & Targets
  previousMonthRevenue: number;
  growthGoalReached: boolean;
  targetDailyForNextMonth: number;
  // Account Separation
  mustSaveForFixedCosts: number;
  // New
  advice?: string;
  suggestedCombo?: {
    name: string;
    price: number;
    originalPrice: number;
  };
}

// Default Settings
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
      name: "Manutenção / Equipamentos",
      percentage: 10,
      color: "orange",
      enabled: true,
    },
  ],
};

const DEFAULT_CHECKLIST: ChecklistItem[] = [
  {
    id: "1",
    text: "Abrir o salão e ligar luzes/ar",
    completed: false,
    category: "morning",
  },
  {
    id: "2",
    text: "Verificar agenda do dia",
    completed: false,
    category: "morning",
  },
  {
    id: "3",
    text: "Organizar bancadas e materiais",
    completed: false,
    category: "morning",
  },
  {
    id: "4",
    text: "Limpeza rápida entre atendimentos",
    completed: false,
    category: "maintenance",
  },
  {
    id: "5",
    text: "Repor produtos de uso frequente",
    completed: false,
    category: "afternoon",
  },
  {
    id: "6",
    text: "Fechar caixa e conferir valores",
    completed: false,
    category: "evening",
  },
  {
    id: "7",
    text: "Limpeza geral e organização para amanhã",
    completed: false,
    category: "evening",
  },
];

interface FinanceContextType {
  settings: FinanceSettings;
  updateSettings: (settings: Partial<FinanceSettings>) => Promise<void>;
  fixedCosts: FixedCost[];
  addFixedCost: (cost: Omit<FixedCost, "id" | "paid">) => Promise<void>;
  toggleFixedCostPaid: (id: string, paid: boolean) => Promise<void>;
  variableCosts: VariableCost[];
  addVariableCost: (cost: Omit<VariableCost, "id">) => Promise<void>;
  financialHealth: FinancialHealth;
  isLoading: boolean;
  addCustomFund: (fund: Omit<CustomFund, "id">) => Promise<void>;
  removeCustomFund: (id: string) => Promise<void>;
  updateCustomFund: (id: string, updates: Partial<CustomFund>) => Promise<void>;
  // Checklist
  checklist: ChecklistItem[];
  toggleChecklistItem: (id: string) => Promise<void>;
  resetDailyChecklist: () => Promise<void>;
}

const FinanceContext = createContext<FinanceContextType | undefined>(undefined);

export function FinanceProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const { appointments, realizedRevenueByDate, services } = useSalonData();

  // State
  const [settings, setSettings] = useState<FinanceSettings>(DEFAULT_SETTINGS);
  const [fixedCosts, setFixedCosts] = useState<FixedCost[]>([]);
  const [variableCosts, setVariableCosts] = useState<VariableCost[]>([]);
  const [checklist, setChecklist] = useState<ChecklistItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Firestore Sync
  useEffect(() => {
    if (!user) {
      setSettings(DEFAULT_SETTINGS);
      setFixedCosts([]);
      setVariableCosts([]);
      setIsLoading(false);
      return;
    }

    const docRef = doc(db, "salon_finance", user.uid);
    const unsubscribe = onSnapshot(
      docRef,
      (docSnap: DocumentSnapshot<DocumentData>) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          // Merge defaults for new fields like customFunds
          setSettings({ ...DEFAULT_SETTINGS, ...data.settings });
          setFixedCosts(data.fixedCosts || []);
          setVariableCosts(data.variableCosts || []);
          setChecklist(data.checklist || []);
        } else {
          // Init doc if not exists
          setDoc(docRef, {
            settings: DEFAULT_SETTINGS,
            fixedCosts: [],
            variableCosts: [],
            checklist: DEFAULT_CHECKLIST,
          });
        }
        setIsLoading(false);
      },
    );

    return () => unsubscribe();
  }, [user]);

  // Actions
  const saveToFirestore = async (
    data: Partial<{
      settings: FinanceSettings;
      fixedCosts: FixedCost[];
      variableCosts: VariableCost[];
      checklist: ChecklistItem[];
    }>,
  ) => {
    if (!user) return;
    const docRef = doc(db, "salon_finance", user.uid);
    await updateDoc(docRef, data);
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
    const updated = [...variableCosts, newCost];
    setVariableCosts(updated);
    await saveToFirestore({ variableCosts: updated });
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

  const resetDailyChecklist = async () => {
    const updated = checklist.map((item) => ({ ...item, completed: false }));
    setChecklist(updated);
    await saveToFirestore({ checklist: updated });
  };

  // Calculations
  const financialHealth = useMemo(() => {
    const today = new Date().toISOString().split("T")[0];
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();

    // 1. Revenue
    const dailyRevenue = realizedRevenueByDate?.[today] || 0;

    // Calculate Monthly Revenue
    let monthlyRevenue = 0;
    let totalAppointmentsCount = 0;

    appointments.forEach((apt) => {
      const aptDate = new Date(apt.date);
      if (
        aptDate.getMonth() === currentMonth &&
        aptDate.getFullYear() === currentYear &&
        apt.status === "confirmed"
      ) {
        monthlyRevenue += apt.price;
        totalAppointmentsCount++;
      }
    });

    // 2. Costs
    const totalFixedCosts = fixedCosts.reduce((acc, c) => acc + c.amount, 0);
    const totalVariableCosts = variableCosts.reduce(
      (acc, c) => acc + c.amount,
      0,
    );

    // 3. Bills Due
    const todayDay = new Date().getDate();
    const billsDueToday = fixedCosts
      .filter((c) => c.dayDue === todayDay && !c.paid)
      .reduce((acc, c) => acc + c.amount, 0);

    const todayDate = new Date();
    const endOfWeek = new Date(todayDate);
    endOfWeek.setDate(todayDate.getDate() + 7);
    const billsDueThisWeek = fixedCosts
      .filter((c) => {
        const isDue = c.dayDue >= todayDay && c.dayDue <= endOfWeek.getDate();
        return isDue && !c.paid;
      })
      .reduce((acc, c) => acc + c.amount, 0);

    // 4. Funds & Allocations
    const fundsAccumulated: Record<string, number> = {};
    let totalFundsAllocation = 0;

    // Ensure customFunds exists (migration fallback)
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

    // 5. Safe to Withdraw
    const netOperatingIncome =
      monthlyRevenue -
      (taxAllocation +
        cardFees +
        totalFundsAllocation +
        (totalFixedCosts / 30) * todayDay); // Pro-rated fixed costs logic approximation

    const safeToWithdraw = Math.max(
      0,
      netOperatingIncome * (settings.ownerSalaryPercent / 100),
    );

    // 6. Goals Logic
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

    // 7. Averages
    const averageTicket =
      totalAppointmentsCount > 0 ? monthlyRevenue / totalAppointmentsCount : 0;
    const projectedRevenue = (monthlyRevenue / todayDay) * daysInMonth;

    // 8. AI Advice & Combo
    let advice = "";
    let suggestedCombo = undefined;

    if (gapToDailyGoal > 0) {
      // Find services that could help close the gap
      // Simple logic: Suggest a combo that is close to the gap or a popular high value service
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
        const discountPrice = originalPrice * 0.86; // 14% OFF

        advice = `Faltam R$ ${gapToDailyGoal.toFixed(2)} para a meta. Sugiro uma oferta relâmpago de ${mainService.name} + ${secondaryService.name}.`;
        suggestedCombo = {
          name: `Combo ${mainService.name} + ${secondaryService.name}`,
          price: discountPrice,
          originalPrice: originalPrice,
        };
      } else {
        advice =
          "Cadastre mais serviços de alto valor para receber sugestões de combos.";
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

      if (averageTicket < targetTicket) {
        advice = `Meta batida! Porém, seu ticket médio (R$ ${averageTicket.toFixed(2)}) está abaixo do ideal para um bairro ${settings.neighborhood || "médio"} (R$ ${targetTicket}). Considere aumentar levemente os preços ou criar combos premium.`;
      } else {
        advice =
          "Parabéns! Meta batida e ticket médio saudável. Foco em fidelização.";
      }
    }

    // 9. Growth Calculations
    const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const yearOfLastMonth = currentMonth === 0 ? currentYear - 1 : currentYear;

    let previousMonthRevenue = 0;
    appointments.forEach((apt) => {
      const aptDate = new Date(apt.date);
      if (
        aptDate.getMonth() === lastMonth &&
        aptDate.getFullYear() === yearOfLastMonth &&
        apt.status === "confirmed"
      ) {
        previousMonthRevenue += apt.price;
      }
    });

    const growthGoalReached =
      previousMonthRevenue > 0
        ? monthlyRevenue >= previousMonthRevenue * 1.2
        : true;

    const targetDailyForNextMonth =
      previousMonthRevenue > 0
        ? (previousMonthRevenue * 1.2) / 30
        : settings.monthlyGoal / 30;

    // 10. Savings Separation
    const mustSaveForFixedCosts = fixedCosts
      .filter((c) => !c.paid)
      .reduce((acc, c) => acc + c.amount, 0);

    return {
      dailyRevenue,
      monthlyRevenue,
      projectedRevenue,
      totalFixedCosts,
      totalVariableCosts,
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
    realizedRevenueByDate,
    services,
    fixedCosts,
    variableCosts,
    settings,
  ]);

  const value = {
    settings,
    updateSettings,
    fixedCosts,
    addFixedCost,
    toggleFixedCostPaid,
    variableCosts,
    addVariableCost,
    financialHealth,
    isLoading,
    addCustomFund,
    removeCustomFund,
    updateCustomFund,
    checklist,
    toggleChecklistItem,
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
