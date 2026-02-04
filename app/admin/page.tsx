"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useAdminAuth } from "@/contexts/AdminAuthContext";
import {
  usePlatformConfig,
  PlatformUser,
  PLANS,
  PlanType,
} from "@/contexts/PlatformConfigContext";
import {
  Users,
  Settings,
  DollarSign,
  UserPlus,
  LogOut,
  Shield,
  TrendingUp,
  CreditCard,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Edit,
  Trash2,
  Save,
  X,
} from "lucide-react";

function getPlanBadgeClass(plan: PlanType) {
  switch (plan) {
    case "essencial":
      return "bg-blue-100 text-blue-700";
    case "profissional":
      return "bg-gradient-to-r from-[#FF6B9D] to-[#C77DFF] text-white";
    case "enterprise":
      return "bg-purple-100 text-purple-700";
    default:
      return "bg-gray-100 text-gray-700";
  }
}

export default function AdminDashboard() {
  const { logout } = useAdminAuth();
  const router = useRouter();
  const {
    config,
    users,
    updateConfig,
    addUser,
    updateUser,
    deleteUser,
  } = usePlatformConfig();

  const [activeTab, setActiveTab] = useState<"overview" | "users" | "settings">("overview");
  const [showUserModal, setShowUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState<PlatformUser | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

  const handleLogout = () => {
    logout();
    router.push("/admin/login");
  };

  const stats = {
    totalUsers: users.length,
    activeUsers: users.filter((u) => u.status === "active").length,
    essencialUsers: users.filter((u) => u.plan === "essencial").length,
    profissionalUsers: users.filter((u) => u.plan === "profissional").length,
    enterpriseUsers: users.filter((u) => u.plan === "enterprise").length,
    inactiveUsers: users.filter((u) => u.status === "inactive").length,
    totalRevenue: users.reduce((sum, u) => {
      return sum + (config.planPrices[u.plan] || 0);
    }, 0),
    monthlyRevenue: users.reduce((sum, u) => {
      return sum + (config.planPrices[u.plan] || 0);
    }, 0),
  };

  const tabs = [
    { id: "overview", label: "Visão Geral", icon: TrendingUp },
    { id: "users", label: "Usuários", icon: Users },
    { id: "settings", label: "Configurações", icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#ffeef8] via-[#fff5f7] to-[#f0f9ff]">
      {/* Header */}
      <div className="bg-white border-b border-[#2d1b2e]/10 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-[#FF6B9D] to-[#C77DFF] rounded-xl flex items-center justify-center shadow-lg">
                <Shield size={24} className="text-white" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-[#2d1b2e]">
                  Painel Administrativo
                </h1>
                <p className="text-[#2d1b2e]/70 text-sm md:text-base">
                  Gestão da Plataforma Agendly Glow
                </p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl transition-colors font-medium"
            >
              <LogOut size={18} />
              Sair
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-8 py-6">
        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-lg p-2 mb-6 flex gap-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg transition-all font-medium ${
                  activeTab === tab.id
                    ? "bg-gradient-to-r from-[#FF6B9D] to-[#C77DFF] text-white shadow-md"
                    : "text-[#2d1b2e]/70 hover:bg-[#ffeef8]"
                }`}
              >
                <Icon size={18} />
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Overview Tab */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                    <Users size={24} className="text-white" />
                  </div>
                </div>
                <h3 className="text-sm text-[#2d1b2e]/70 mb-1">Total de Usuários</h3>
                <p className="text-3xl font-bold text-[#2d1b2e]">{stats.totalUsers}</p>
              </div>

              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center">
                    <CheckCircle2 size={24} className="text-white" />
                  </div>
                </div>
                <h3 className="text-sm text-[#2d1b2e]/70 mb-1">Usuários Ativos</h3>
                <p className="text-3xl font-bold text-[#2d1b2e]">{stats.activeUsers}</p>
              </div>

              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center">
                    <CreditCard size={24} className="text-white" />
                  </div>
                </div>
                <h3 className="text-sm text-[#2d1b2e]/70 mb-1">Receita Mensal</h3>
                <p className="text-2xl font-bold text-[#2d1b2e]">
                  R$ {stats.monthlyRevenue.toFixed(2).replace(".", ",")}
                </p>
              </div>

              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg flex items-center justify-center">
                    <DollarSign size={24} className="text-white" />
                  </div>
                </div>
                <h3 className="text-sm text-[#2d1b2e]/70 mb-1">Taxa de Receita</h3>
                <p className="text-3xl font-bold text-[#2d1b2e]">{config.revenueRate}%</p>
              </div>
            </div>

            {/* Plan Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                    <CreditCard size={20} className="text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-[#2d1b2e]">{PLANS.essencial.name}</h3>
                    <p className="text-xs text-[#2d1b2e]/70">{PLANS.essencial.description}</p>
                  </div>
                </div>
                <div className="mt-4">
                  <p className="text-2xl font-bold text-[#2d1b2e]">{stats.essencialUsers}</p>
                  <p className="text-sm text-[#2d1b2e]/70">usuários</p>
                  <p className="text-sm text-green-600 font-semibold mt-2">
                    R$ {config.planPrices.essencial.toFixed(2).replace(".", ",")}/mês
                  </p>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-lg p-6 border-2 border-[#FF6B9D]">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-gradient-to-br from-[#FF6B9D] to-[#C77DFF] rounded-lg flex items-center justify-center">
                    <CreditCard size={20} className="text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-[#2d1b2e]">{PLANS.profissional.name}</h3>
                    <p className="text-xs text-[#2d1b2e]/70">{PLANS.profissional.description}</p>
                  </div>
                </div>
                <div className="mt-4">
                  <p className="text-2xl font-bold text-[#2d1b2e]">{stats.profissionalUsers}</p>
                  <p className="text-sm text-[#2d1b2e]/70">usuários</p>
                  <p className="text-sm text-green-600 font-semibold mt-2">
                    R$ {config.planPrices.profissional.toFixed(2).replace(".", ",")}/mês
                  </p>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center">
                    <CreditCard size={20} className="text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-[#2d1b2e]">{PLANS.enterprise.name}</h3>
                    <p className="text-xs text-[#2d1b2e]/70">{PLANS.enterprise.description}</p>
                  </div>
                </div>
                <div className="mt-4">
                  <p className="text-2xl font-bold text-[#2d1b2e]">{stats.enterpriseUsers}</p>
                  <p className="text-sm text-[#2d1b2e]/70">usuários</p>
                  <p className="text-sm text-green-600 font-semibold mt-2">
                    R$ {config.planPrices.enterprise.toFixed(2).replace(".", ",")}/mês
                  </p>
                </div>
              </div>
            </div>

            {/* Recent Users */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-[#2d1b2e]">Usuários Recentes</h2>
                <button
                  onClick={() => {
                    setEditingUser(null);
                    setShowUserModal(true);
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#FF6B9D] to-[#C77DFF] text-white rounded-xl hover:shadow-lg transition-all font-medium"
                >
                  <UserPlus size={18} />
                  Novo Usuário
                </button>
              </div>
              <div className="space-y-3">
                {users.slice(-5).reverse().map((user) => (
                  <div
                    key={user.id}
                    className="p-4 bg-[#ffeef8] rounded-lg border border-[#FF6B9D]/20 flex items-center justify-between"
                  >
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-[#2d1b2e]">{user.name}</span>
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${getPlanBadgeClass(
                            user.plan
                          )}`}
                        >
                          {PLANS[user.plan].name}
                        </span>
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            user.status === "active"
                              ? "bg-green-100 text-green-700"
                              : user.status === "inactive"
                              ? "bg-gray-100 text-gray-700"
                              : "bg-red-100 text-red-700"
                          }`}
                        >
                          {user.status === "active"
                            ? "Ativo"
                            : user.status === "inactive"
                            ? "Inativo"
                            : "Suspenso"}
                        </span>
                      </div>
                      <p className="text-sm text-[#2d1b2e]/70">{user.email}</p>
                    </div>
                  </div>
                ))}
                {users.length === 0 && (
                  <p className="text-center text-[#2d1b2e]/50 py-8">
                    Nenhum usuário cadastrado
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Users Tab */}
        {activeTab === "users" && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-[#2d1b2e]">Gestão de Usuários</h2>
                <button
                  onClick={() => {
                    setEditingUser(null);
                    setShowUserModal(true);
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#FF6B9D] to-[#C77DFF] text-white rounded-xl hover:shadow-lg transition-all font-medium"
                >
                  <UserPlus size={18} />
                  Novo Usuário
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-[#2d1b2e]/10">
                      <th className="text-left py-3 px-4 text-sm font-semibold text-[#2d1b2e]">
                        Nome
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-[#2d1b2e]">
                        Email
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-[#2d1b2e]">
                        Plano
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-[#2d1b2e]">
                        Status
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-[#2d1b2e]">
                        Criado em
                      </th>
                      <th className="text-right py-3 px-4 text-sm font-semibold text-[#2d1b2e]">
                        Ações
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user) => (
                      <tr
                        key={user.id}
                        className="border-b border-[#2d1b2e]/5 hover:bg-[#ffeef8] transition-colors"
                      >
                        <td className="py-3 px-4">
                          <span className="font-medium text-[#2d1b2e]">{user.name}</span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-[#2d1b2e]/70">{user.email}</span>
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${getPlanBadgeClass(
                              user.plan
                            )}`}
                          >
                            {PLANS[user.plan].name}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${
                              user.status === "active"
                                ? "bg-green-100 text-green-700"
                                : user.status === "inactive"
                                ? "bg-gray-100 text-gray-700"
                                : "bg-red-100 text-red-700"
                            }`}
                          >
                            {user.status === "active"
                              ? "Ativo"
                              : user.status === "inactive"
                              ? "Inativo"
                              : "Suspenso"}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-sm text-[#2d1b2e]/70">
                            {new Date(user.createdAt).toLocaleDateString("pt-BR")}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => {
                                setEditingUser(user);
                                setShowUserModal(true);
                              }}
                              className="p-2 hover:bg-blue-50 text-blue-600 rounded-lg transition-colors"
                              title="Editar"
                            >
                              <Edit size={16} />
                            </button>
                            <button
                              onClick={() => setShowDeleteConfirm(user.id)}
                              className="p-2 hover:bg-red-50 text-red-600 rounded-lg transition-colors"
                              title="Excluir"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {users.length === 0 && (
                      <tr>
                        <td colSpan={6} className="py-12 text-center text-[#2d1b2e]/50">
                          Nenhum usuário cadastrado
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Settings Tab */}
        {activeTab === "settings" && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-bold text-[#2d1b2e] mb-6">
                Configurações da Plataforma
              </h2>

              <div className="space-y-6">
                {/* Taxa de Receita */}
                <div>
                  <label className="block text-sm font-semibold text-[#2d1b2e] mb-2">
                    Taxa de Receita da Plataforma (%)
                  </label>
                  <div className="flex items-center gap-4">
                    <input
                      type="number"
                      min={config.minRevenueRate}
                      max={config.maxRevenueRate}
                      value={config.revenueRate}
                      onChange={(e) =>
                        updateConfig({ revenueRate: parseFloat(e.target.value) || 0 })
                      }
                      className="flex-1 px-4 py-2 border-2 border-[#2d1b2e]/10 rounded-xl focus:outline-none focus:border-[#FF6B9D] text-[#2d1b2e] font-medium"
                    />
                    <span className="text-[#2d1b2e]/70">
                      Min: {config.minRevenueRate}% | Max: {config.maxRevenueRate}%
                    </span>
                  </div>
                  <p className="text-sm text-[#2d1b2e]/50 mt-2">
                    Percentual que a plataforma recebe sobre cada transação
                  </p>
                </div>

                {/* Taxa Fixa */}
                <div>
                  <label className="block text-sm font-semibold text-[#2d1b2e] mb-2">
                    Taxa Fixa da Plataforma (R$)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={config.platformFee}
                    onChange={(e) =>
                      updateConfig({ platformFee: parseFloat(e.target.value) || 0 })
                    }
                    className="w-full px-4 py-2 border-2 border-[#2d1b2e]/10 rounded-xl focus:outline-none focus:border-[#FF6B9D] text-[#2d1b2e] font-medium"
                  />
                  <p className="text-sm text-[#2d1b2e]/50 mt-2">
                    Taxa fixa cobrada por transação (além da taxa percentual)
                  </p>
                </div>

                {/* Modo Manutenção */}
                <div className="flex items-center justify-between p-4 bg-[#ffeef8] rounded-xl border border-[#FF6B9D]/20">
                  <div>
                    <h3 className="font-semibold text-[#2d1b2e] mb-1">Modo Manutenção</h3>
                    <p className="text-sm text-[#2d1b2e]/70">
                      Bloqueia o acesso de todos os usuários à plataforma
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={config.maintenanceMode}
                      onChange={(e) => updateConfig({ maintenanceMode: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#FF6B9D]/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#FF6B9D]"></div>
                  </label>
                </div>

                {/* Permitir Novos Cadastros */}
                <div className="flex items-center justify-between p-4 bg-[#ffeef8] rounded-xl border border-[#FF6B9D]/20">
                  <div>
                    <h3 className="font-semibold text-[#2d1b2e] mb-1">
                      Permitir Novos Cadastros
                    </h3>
                    <p className="text-sm text-[#2d1b2e]/70">
                      Permite que novos usuários se cadastrem na plataforma
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={config.allowNewSignups}
                      onChange={(e) => updateConfig({ allowNewSignups: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#FF6B9D]/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#FF6B9D]"></div>
                  </label>
                </div>

                {/* Plano Padrão */}
                <div>
                  <label className="block text-sm font-semibold text-[#2d1b2e] mb-2">
                    Plano Padrão para Novos Usuários
                  </label>
                  <select
                    value={config.defaultPlan}
                    onChange={(e) =>
                      updateConfig({
                        defaultPlan: e.target.value as PlanType,
                      })
                    }
                    className="w-full px-4 py-2 border-2 border-[#2d1b2e]/10 rounded-xl focus:outline-none focus:border-[#FF6B9D] text-[#2d1b2e] font-medium"
                  >
                    <option value="essencial">{PLANS.essencial.name}</option>
                    <option value="profissional">{PLANS.profissional.name}</option>
                    <option value="enterprise">{PLANS.enterprise.name}</option>
                  </select>
                </div>

                {/* Preços dos Planos */}
                <div className="space-y-4 pt-4 border-t border-[#2d1b2e]/10">
                  <h3 className="text-lg font-bold text-[#2d1b2e] mb-4">Preços dos Planos</h3>
                  
                  <div>
                    <label className="block text-sm font-semibold text-[#2d1b2e] mb-2">
                      {PLANS.essencial.name} (R$/mês)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={config.planPrices.essencial}
                      onChange={(e) =>
                        updateConfig({
                          planPrices: {
                            ...config.planPrices,
                            essencial: parseFloat(e.target.value) || 0,
                          },
                        })
                      }
                      className="w-full px-4 py-2 border-2 border-[#2d1b2e]/10 rounded-xl focus:outline-none focus:border-[#FF6B9D] text-[#2d1b2e] font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-[#2d1b2e] mb-2">
                      {PLANS.profissional.name} (R$/mês)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={config.planPrices.profissional}
                      onChange={(e) =>
                        updateConfig({
                          planPrices: {
                            ...config.planPrices,
                            profissional: parseFloat(e.target.value) || 0,
                          },
                        })
                      }
                      className="w-full px-4 py-2 border-2 border-[#2d1b2e]/10 rounded-xl focus:outline-none focus:border-[#FF6B9D] text-[#2d1b2e] font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-[#2d1b2e] mb-2">
                      {PLANS.enterprise.name} (R$/mês)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={config.planPrices.enterprise}
                      onChange={(e) =>
                        updateConfig({
                          planPrices: {
                            ...config.planPrices,
                            enterprise: parseFloat(e.target.value) || 0,
                          },
                        })
                      }
                      className="w-full px-4 py-2 border-2 border-[#2d1b2e]/10 rounded-xl focus:outline-none focus:border-[#FF6B9D] text-[#2d1b2e] font-medium"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* User Modal */}
      {showUserModal && (
        <UserModal
          user={editingUser}
          onClose={() => {
            setShowUserModal(false);
            setEditingUser(null);
          }}
          onSave={(userData) => {
            if (editingUser) {
              updateUser(editingUser.id, userData);
            } else {
              addUser(userData);
            }
            setShowUserModal(false);
            setEditingUser(null);
          }}
        />
      )}

      {/* Delete Confirm Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl p-6 max-w-md w-full">
            <h3 className="text-xl font-bold text-[#2d1b2e] mb-2">Confirmar Exclusão</h3>
            <p className="text-[#2d1b2e]/70 mb-6">
              Tem certeza que deseja excluir este usuário? Esta ação não pode ser desfeita.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="flex-1 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-[#2d1b2e] rounded-xl transition-colors font-medium"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  deleteUser(showDeleteConfirm);
                  setShowDeleteConfirm(null);
                }}
                className="flex-1 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-xl transition-colors font-medium"
              >
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function UserModal({
  user,
  onClose,
  onSave,
}: {
  user: PlatformUser | null;
  onClose: () => void;
  onSave: (data: Omit<PlatformUser, "id" | "createdAt">) => void;
}) {
  const [name, setName] = useState(user?.name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [plan, setPlan] = useState<PlanType>(user?.plan || "essencial");
  const [status, setStatus] = useState<"active" | "inactive" | "suspended">(
    user?.status || "active"
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) {
      alert("Por favor, preencha todos os campos obrigatórios");
      return;
    }
    onSave({ name, email, plan, status });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl p-6 max-w-md w-full">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-[#2d1b2e]">
            {user ? "Editar Usuário" : "Novo Usuário"}
          </h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={20} className="text-[#2d1b2e]" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-[#2d1b2e] mb-2">
              Nome *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2 border-2 border-[#2d1b2e]/10 rounded-xl focus:outline-none focus:border-[#FF6B9D] text-[#2d1b2e]"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-[#2d1b2e] mb-2">
              Email *
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 border-2 border-[#2d1b2e]/10 rounded-xl focus:outline-none focus:border-[#FF6B9D] text-[#2d1b2e]"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-[#2d1b2e] mb-2">Plano</label>
            <select
              value={plan}
              onChange={(e) => setPlan(e.target.value as PlanType)}
              className="w-full px-4 py-2 border-2 border-[#2d1b2e]/10 rounded-xl focus:outline-none focus:border-[#FF6B9D] text-[#2d1b2e]"
            >
              <option value="essencial">{PLANS.essencial.name} - R$ {PLANS.essencial.price.toFixed(2).replace(".", ",")}/mês</option>
              <option value="profissional">{PLANS.profissional.name} - R$ {PLANS.profissional.price.toFixed(2).replace(".", ",")}/mês</option>
              <option value="enterprise">{PLANS.enterprise.name} - R$ {PLANS.enterprise.price.toFixed(2).replace(".", ",")}/mês</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-[#2d1b2e] mb-2">Status</label>
            <select
              value={status}
              onChange={(e) =>
                setStatus(e.target.value as "active" | "inactive" | "suspended")
              }
              className="w-full px-4 py-2 border-2 border-[#2d1b2e]/10 rounded-xl focus:outline-none focus:border-[#FF6B9D] text-[#2d1b2e]"
            >
              <option value="active">Ativo</option>
              <option value="inactive">Inativo</option>
              <option value="suspended">Suspenso</option>
            </select>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-[#2d1b2e] rounded-xl transition-colors font-medium"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-gradient-to-r from-[#FF6B9D] to-[#C77DFF] text-white rounded-xl hover:shadow-lg transition-all font-medium"
            >
              Salvar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
