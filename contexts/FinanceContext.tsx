"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useMemo,
} from "react";
import { useSalonData } from "./SalonDataContext";

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

export interface FinanceSettings {
  monthlyGoal: number;
  taxRate: number; // % (e.g., 6% SIMPLES)
  cardFeeRate: number; // % average
  reinvestmentRate: number; // % for upgrades/depreciation
  emergencyFundRate: number; // % for safety net
  ownerSalaryFixed: number; // Fixed draw
  ownerSalaryPercent: number; // % profit share
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
  maintenanceFundAccumulated: number;
  emergencyFundAccumulated: number;
  dailyGoalStatus: "behind" | "on_track" | "ahead";
  gapToDailyGoal: number;
  averageTicket: number;
}

// Default Settings
const DEFAULT_SETTINGS: FinanceSettings = {
  monthlyGoal: 20000,
  taxRate: 6,
  cardFeeRate: 2,
  reinvestmentRate: 10, // 10% for depreciation/upgrades
  emergencyFundRate: 5, // 5% for emergency
  ownerSalaryFixed: 3000,
  ownerSalaryPercent: 20,
};

interface FinanceContextType {
  settings: FinanceSettings;
  updateSettings: (settings: Partial<FinanceSettings>) => void;
  fixedCosts: FixedCost[];
  addFixedCost: (cost: Omit<FixedCost, "id" | "paid">) => void;
  toggleFixedCostPaid: (id: string, paid: boolean) => void;
  variableCosts: VariableCost[];
  addVariableCost: (cost: Omit<VariableCost, "id">) => void;
  financialHealth: FinancialHealth;
}

const FinanceContext = createContext<FinanceContextType | undefined>(undefined);

export function FinanceProvider({ children }: { children: React.ReactNode }) {
  const { appointments, realizedRevenueByDate } = useSalonData();

  // State
  const [settings, setSettings] = useState<FinanceSettings>(DEFAULT_SETTINGS);
  const [fixedCosts, setFixedCosts] = useState<FixedCost[]>([]);
  const [variableCosts, setVariableCosts] = useState<VariableCost[]>([]);

  // Load from LocalStorage on mount
  useEffect(() => {
    const savedSettings = localStorage.getItem("salon_finance_settings");
    if (savedSettings) setSettings(JSON.parse(savedSettings));

    const savedFixed = localStorage.getItem("salon_finance_fixed");
    if (savedFixed) setFixedCosts(JSON.parse(savedFixed));

    const savedVariable = localStorage.getItem("salon_finance_variable");
    if (savedVariable) setVariableCosts(JSON.parse(savedVariable));
  }, []);

  // Save to LocalStorage on change
  useEffect(() => {
    localStorage.setItem("salon_finance_settings", JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    localStorage.setItem("salon_finance_fixed", JSON.stringify(fixedCosts));
  }, [fixedCosts]);

  useEffect(() => {
    localStorage.setItem(
      "salon_finance_variable",
      JSON.stringify(variableCosts),
    );
  }, [variableCosts]);

  // Actions
  const updateSettings = (newSettings: Partial<FinanceSettings>) => {
    setSettings((prev) => ({ ...prev, ...newSettings }));
  };

  const addFixedCost = (cost: Omit<FixedCost, "id" | "paid">) => {
    const newCost: FixedCost = {
      ...cost,
      id: crypto.randomUUID(),
      paid: false,
    };
    setFixedCosts((prev) => [...prev, newCost]);
  };

  const toggleFixedCostPaid = (id: string, paid: boolean) => {
    setFixedCosts((prev) =>
      prev.map((c) => (c.id === id ? { ...c, paid } : c)),
    );
  };

  const addVariableCost = (cost: Omit<VariableCost, "id">) => {
    const newCost: VariableCost = {
      ...cost,
      id: crypto.randomUUID(),
    };
    setVariableCosts((prev) => [...prev, newCost]);
  };

  // Calculations
  const financialHealth = useMemo(() => {
    const today = new Date().toISOString().split("T")[0];
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();

    // 1. Revenue
    const dailyRevenue = realizedRevenueByDate?.[today] || 0;

    // Calculate Monthly Revenue (Filter appointments by current month)
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
    ); // Need to filter by month too ideally

    // 3. Bills Due
    const todayDay = new Date().getDate();
    const billsDueToday = fixedCosts
      .filter((c) => c.dayDue === todayDay && !c.paid)
      .reduce((acc, c) => acc + c.amount, 0);

    // 4. Funds & Allocations
    // We allocate a percentage of REVENUE to these funds
    const maintenanceFundAccumulated =
      monthlyRevenue * (settings.reinvestmentRate / 100);
    const emergencyFundAccumulated =
      monthlyRevenue * (settings.emergencyFundRate / 100);
    const taxAllocation = monthlyRevenue * (settings.taxRate / 100);
    const cardFees = monthlyRevenue * (settings.cardFeeRate / 100);

    // 5. Safe to Withdraw (Owner)
    // Revenue - (Fixed Costs + Variable Costs + Taxes + Funds)
    // *Simplified*: For daily view, we might want to show "What is yours from TODAY'S income"
    // Net Income = Revenue - (Taxes + Card Fees + Fund Contributions)
    const netOperatingIncome =
      monthlyRevenue -
      (taxAllocation +
        cardFees +
        maintenanceFundAccumulated +
        emergencyFundAccumulated);
    // Subtract prorated fixed costs? That's complex. Let's stick to "Cash Flow" view.
    // Safe to Withdraw logic: Net Income - (Prorated Fixed Costs for the month so far?)
    // Let's keep it simple: Net Liquid after allocations.
    const safeToWithdraw =
      netOperatingIncome * (settings.ownerSalaryPercent / 100); // Or whatever logic user wants

    // 6. Goals
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
    const projectedRevenue = (monthlyRevenue / todayDay) * daysInMonth; // Linear projection

    return {
      dailyRevenue,
      monthlyRevenue,
      projectedRevenue,
      totalFixedCosts,
      totalVariableCosts,
      billsDueToday,
      billsDueThisWeek: 0, // todo
      safeToWithdraw,
      maintenanceFundAccumulated,
      emergencyFundAccumulated,
      dailyGoalStatus,
      gapToDailyGoal,
      averageTicket,
    };
  }, [
    appointments,
    realizedRevenueByDate,
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
