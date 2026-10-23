"use client";

export const dynamic = "force-dynamic";

import React, { useState, useMemo } from "react";
import { Header } from "@/components/Header";
import { useSalonData, Product } from "@/contexts/SalonDataContext";
import {
  Package,
  Plus,
  AlertTriangle,
  ArrowUpCircle,
  ArrowDownCircle,
  Edit2,
  Trash2,
  X,
  Search,
  History,
  TrendingUp,
  Truck,
  Calendar,
} from "lucide-react";

const PRODUCT_CATEGORIES: Product["category"][] = [
  "Tintas e Químicos",
  "Esmaltes e Unhas",
  "Cosméticos e Tratamentos",
  "Descartáveis",
  "Revenda",
];

export default function EstoquePage() {
  const {
    products,
    stockMovements,
    addProduct,
    updateProduct,
    deleteProduct,
    registerStockMovement,
  } = useSalonData();

  const [activeTab, setActiveTab] = useState<
    "catalog" | "movements" | "reports"
  >("catalog");
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const [movementModal, setMovementModal] = useState<{
    product: Product;
    type: "in" | "out";
  } | null>(null);
  const [movementQty, setMovementQty] = useState(1);
  const [movementReason, setMovementReason] = useState("");

  const [formData, setFormData] = useState<{
    name: string;
    category: Product["category"];
    quantity: number;
    minQuantity: number;
    unit: "un" | "ml" | "g" | "kit";
    costPrice: number;
    salePrice: number;
    supplier: string;
    expirationDate: string;
    isForSale: boolean;
  }>({
    name: "",
    category: PRODUCT_CATEGORIES[0],
    quantity: 10,
    minQuantity: 3,
    unit: "un",
    costPrice: 25,
    salePrice: 59.9,
    supplier: "",
    expirationDate: "",
    isForSale: false,
  });

  const openCreate = () => {
    setEditingProduct(null);
    setFormData({
      name: "",
      category: PRODUCT_CATEGORIES[0],
      quantity: 10,
      minQuantity: 3,
      unit: "un",
      costPrice: 25,
      salePrice: 59.9,
      supplier: "",
      expirationDate: "",
      isForSale: false,
    });
    setShowProductModal(true);
  };

  const openEdit = (prod: Product) => {
    setEditingProduct(prod);
    setFormData({
      name: prod.name,
      category: prod.category,
      quantity: prod.quantity,
      minQuantity: prod.minQuantity,
      unit: prod.unit,
      costPrice: prod.costPrice,
      salePrice: prod.salePrice || 0,
      supplier: prod.supplier || "",
      expirationDate: prod.expirationDate || "",
      isForSale: prod.isForSale ?? false,
    });
    setShowProductModal(true);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload: Omit<Product, "id"> = {
      name: formData.name,
      category: formData.category,
      quantity: Number(formData.quantity),
      minQuantity: Number(formData.minQuantity),
      unit: formData.unit,
      costPrice: Number(formData.costPrice),
      salePrice: Number(formData.salePrice),
      supplier: formData.supplier,
      expirationDate: formData.expirationDate || undefined,
      isForSale: formData.isForSale,
    };

    if (editingProduct) {
      await updateProduct(editingProduct.id, payload);
    } else {
      await addProduct(payload);
    }
    setShowProductModal(false);
  };

  const handleConfirmMovement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!movementModal) return;
    await registerStockMovement({
      productId: movementModal.product.id,
      productName: movementModal.product.name,
      type: movementModal.type,
      quantity: Number(movementQty),
      unitCost: movementModal.product.costPrice,
      reason:
        movementReason ||
        (movementModal.type === "in"
          ? "Reposição de fornecedor"
          : "Uso interno / Venda"),
      date: new Date().toISOString().split("T")[0],
    });
    setMovementModal(null);
    setMovementQty(1);
    setMovementReason("");
  };

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchSearch =
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        (p.supplier || "").toLowerCase().includes(search.toLowerCase());
      const matchCat =
        categoryFilter === "all" || p.category === categoryFilter;
      return matchSearch && matchCat;
    });
  }, [products, search, categoryFilter]);

  const lowStockProducts = useMemo(
    () => products.filter((p) => p.quantity <= p.minQuantity),
    [products],
  );

  const expiringSoonProducts = useMemo(() => {
    const now = new Date();
    const in30Days = new Date();
    in30Days.setDate(now.getDate() + 30);
    return products.filter((p) => {
      if (!p.expirationDate) return false;
      const exp = new Date(p.expirationDate + "T12:00:00");
      return exp <= in30Days;
    });
  }, [products]);

  const totalInventoryValue = useMemo(
    () => products.reduce((sum, p) => sum + p.quantity * p.costPrice, 0),
    [products],
  );

  const topUsedProducts = useMemo(() => {
    const map: Record<string, { name: string; totalOut: number }> = {};
    stockMovements
      .filter((m) => m.type === "out" || m.type === "service_deduction" || m.type === "sale")
      .forEach((m) => {
        if (!map[m.productId]) {
          map[m.productId] = { name: m.productName, totalOut: 0 };
        }
        map[m.productId].totalOut += m.quantity;
      });
    return Object.values(map).sort((a, b) => b.totalOut - a.totalOut);
  }, [stockMovements]);

  return (
    <div className="flex flex-col h-full bg-[var(--background)]">
      <Header title="Estoque, Produtos & Insumos" />

      <div className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8 space-y-6">
        {/* KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-[var(--card-bg)] p-5 rounded-2xl border border-[var(--card-border)] shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase text-[var(--muted)]">
                Total de Itens
              </span>
              <Package className="text-[var(--primary)]" size={18} />
            </div>
            <p className="text-2xl font-bold text-[var(--foreground)] tabular-nums">
              {products.length} produtos
            </p>
            <p className="text-xs text-[var(--muted)] mt-1 tabular-nums">
              Custo em estoque: R$ {totalInventoryValue.toFixed(2)}
            </p>
          </div>

          <div className="bg-[var(--card-bg)] p-5 rounded-2xl border border-[var(--card-border)] shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase text-[var(--muted)]">
                Alerta de Reposição
              </span>
              <AlertTriangle className="text-amber-600" size={18} />
            </div>
            <p className="text-2xl font-bold text-amber-600 tabular-nums">
              {lowStockProducts.length} abaixo do mínimo
            </p>
            <p className="text-xs text-[var(--muted)] mt-1 truncate">
              {lowStockProducts.length > 0
                ? lowStockProducts
                    .map((p) => p.name)
                    .slice(0, 2)
                    .join(", ")
                : "Estoque saudável"}
            </p>
          </div>

          <div className="bg-[var(--card-bg)] p-5 rounded-2xl border border-[var(--card-border)] shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase text-[var(--muted)]">
                Validade Próxima (30d)
              </span>
              <Calendar className="text-rose-600" size={18} />
            </div>
            <p className="text-2xl font-bold text-rose-600 tabular-nums">
              {expiringSoonProducts.length} itens
            </p>
            <p className="text-xs text-[var(--muted)] mt-1">
              Controle de lotes e vencimento
            </p>
          </div>

          <div className="bg-[var(--card-bg)] p-5 rounded-2xl border border-[var(--card-border)] shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase text-[var(--muted)]">
                Movimentações
              </span>
              <History className="text-emerald-600" size={18} />
            </div>
            <p className="text-2xl font-bold text-[var(--foreground)] tabular-nums">
              {stockMovements.length} registros
            </p>
            <p className="text-xs text-[var(--muted)] mt-1">
              Inclui baixa automática por serviço
            </p>
          </div>
        </div>

        {/* Tabs & Actions */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex overflow-x-auto bg-[var(--card-bg)] p-1.5 rounded-2xl border border-[var(--card-border)] w-full md:w-fit no-scrollbar">
            {[
              { id: "catalog", label: "Produtos & Insumos", icon: Package },
              {
                id: "movements",
                label: "Histórico de Movimentações",
                icon: History,
              },
              {
                id: "reports",
                label: "Mais Usados & Vendidos",
                icon: TrendingUp,
              },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id as typeof activeTab)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all shrink-0 cursor-pointer ${
                  activeTab === t.id
                    ? "bg-[var(--primary)] text-white shadow-xs"
                    : "text-[var(--muted)] hover:text-[var(--foreground)]"
                }`}
              >
                <t.icon size={16} />
                {t.label}
              </button>
            ))}
          </div>

          <button
            onClick={openCreate}
            className="flex items-center justify-center gap-2 bg-[var(--primary)] hover:bg-[var(--primary-dark)] text-white px-5 py-3 rounded-xl font-semibold text-sm shadow-sm cursor-pointer w-full md:w-auto"
          >
            <Plus size={18} />
            Novo Produto
          </button>
        </div>

        {/* TAB 1: CATALOG */}
        {activeTab === "catalog" && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search
                  size={16}
                  className="absolute left-3.5 top-3 text-[var(--muted)]"
                />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Buscar por nome do produto ou fornecedor..."
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[var(--card-border)] bg-[var(--card-bg)] text-sm"
                />
              </div>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-4 py-2.5 rounded-xl border border-[var(--card-border)] bg-[var(--card-bg)] text-sm"
              >
                <option value="all">Todas as Categorias</option>
                {PRODUCT_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            {filteredProducts.length === 0 ? (
              <div className="bg-[var(--card-bg)] rounded-3xl p-12 text-center border border-dashed border-[var(--card-border)]">
                <Package
                  size={40}
                  className="mx-auto mb-3 text-[var(--muted)]"
                />
                <h3 className="font-bold text-[var(--foreground)]">
                  Nenhum produto cadastrado
                </h3>
                <p className="text-xs text-[var(--muted)] mt-1 mb-4 max-w-md mx-auto">
                  Cadastre tintas, esmaltes, cosméticos e produtos de revenda para controlar estoque e validade automaticamente.
                </p>
                <button
                  onClick={openCreate}
                  className="bg-[var(--primary)] text-white px-5 py-2.5 rounded-xl text-sm font-semibold cursor-pointer"
                >
                  Cadastrar Primeiro Produto
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredProducts.map((prod) => {
                  const isLow = prod.quantity <= prod.minQuantity;
                  return (
                    <div
                      key={prod.id}
                      className={`bg-[var(--card-bg)] rounded-2xl p-5 border shadow-xs flex flex-col justify-between ${
                        isLow
                          ? "border-amber-400/80"
                          : "border-[var(--card-border)]"
                      }`}
                    >
                      <div>
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div className="min-w-0">
                            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[var(--primary-light)] text-[var(--primary)]">
                              {prod.category}
                            </span>
                            <h4 className="font-bold text-[var(--foreground)] text-base mt-1.5 truncate">
                              {prod.name}
                            </h4>
                          </div>
                          <div className="flex gap-1 shrink-0">
                            <button
                              onClick={() => openEdit(prod)}
                              className="p-1.5 rounded-lg text-[var(--muted)] hover:text-[var(--primary)] cursor-pointer"
                              title="Editar"
                            >
                              <Edit2 size={15} />
                            </button>
                            <button
                              onClick={() => {
                                if (confirm(`Excluir ${prod.name}?`)) {
                                  deleteProduct(prod.id);
                                }
                              }}
                              className="p-1.5 rounded-lg text-[var(--muted)] hover:text-red-600 cursor-pointer"
                              title="Excluir"
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2 my-3 p-3 rounded-xl bg-[var(--background)] text-xs">
                          <div>
                            <span className="text-[var(--muted)] block">
                              Disponível
                            </span>
                            <span
                              className={`text-base font-bold tabular-nums ${
                                isLow
                                  ? "text-amber-600"
                                  : "text-[var(--foreground)]"
                              }`}
                            >
                              {prod.quantity} {prod.unit}
                            </span>
                            {isLow && (
                              <span className="block text-[10px] font-bold text-amber-600">
                                ⚠ Repor (Mín: {prod.minQuantity})
                              </span>
                            )}
                          </div>
                          <div>
                            <span className="text-[var(--muted)] block">
                              Custo / Venda
                            </span>
                            <span className="font-semibold text-[var(--foreground)] tabular-nums">
                              R$ {prod.costPrice.toFixed(2)}
                            </span>
                            {prod.isForSale && prod.salePrice ? (
                              <span className="block text-[11px] text-emerald-600 font-bold tabular-nums">
                                Venda: R$ {prod.salePrice.toFixed(2)}
                              </span>
                            ) : null}
                          </div>
                        </div>

                        <div className="space-y-1 text-xs text-[var(--muted)]">
                          {prod.supplier && (
                            <p className="flex items-center gap-1.5 truncate">
                              <Truck size={13} className="shrink-0" /> Fornecedor:{" "}
                              {prod.supplier}
                            </p>
                          )}
                          {prod.expirationDate && (
                            <p className="flex items-center gap-1.5">
                              <Calendar size={13} className="shrink-0" /> Validade:{" "}
                              {new Date(
                                prod.expirationDate + "T12:00:00",
                              ).toLocaleDateString("pt-BR")}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex gap-2 mt-4 pt-3 border-t border-[var(--card-border)]">
                        <button
                          onClick={() =>
                            setMovementModal({ product: prod, type: "in" })
                          }
                          className="flex-1 py-2.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <ArrowUpCircle size={14} />
                          Entrada
                        </button>
                        <button
                          onClick={() =>
                            setMovementModal({ product: prod, type: "out" })
                          }
                          className="flex-1 py-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <ArrowDownCircle size={14} />
                          Baixa / Saída
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: MOVEMENTS */}
        {activeTab === "movements" && (
          <div className="bg-[var(--card-bg)] rounded-2xl p-5 sm:p-6 border border-[var(--card-border)] shadow-xs">
            <h3 className="font-bold text-[var(--foreground)] mb-4">
              Histórico de Entradas, Saídas e Baixas Automáticas
            </h3>
            {stockMovements.length === 0 ? (
              <p className="text-sm text-[var(--muted)] py-8 text-center">
                Nenhuma movimentação registrada ainda.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm min-w-[500px]">
                  <thead>
                    <tr className="border-b border-[var(--card-border)] text-xs text-[var(--muted)] uppercase">
                      <th className="py-2.5">Data</th>
                      <th className="py-2.5">Produto</th>
                      <th className="py-2.5">Tipo</th>
                      <th className="py-2.5">Qtd</th>
                      <th className="py-2.5">Motivo</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stockMovements.map((m) => (
                      <tr
                        key={m.id}
                        className="border-b border-[var(--card-border)]/50"
                      >
                        <td className="py-2.5 text-xs tabular-nums">
                          {new Date(m.date + "T12:00:00").toLocaleDateString(
                            "pt-BR",
                          )}
                        </td>
                        <td className="py-2.5 font-semibold">
                          {m.productName}
                        </td>
                        <td className="py-2.5">
                          <span
                            className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                              m.type === "in"
                                ? "bg-emerald-100 text-emerald-700"
                                : m.type === "service_deduction"
                                  ? "bg-purple-100 text-purple-700"
                                  : "bg-rose-100 text-rose-700"
                            }`}
                          >
                            {m.type === "in"
                              ? "Entrada"
                              : m.type === "service_deduction"
                                ? "Baixa em Serviço"
                                : "Saída Manual"}
                          </span>
                        </td>
                        <td className="py-2.5 font-bold tabular-nums">
                          {m.type === "in" ? `+${m.quantity}` : `-${m.quantity}`}
                        </td>
                        <td className="py-2.5 text-xs text-[var(--muted)]">
                          {m.reason}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: REPORTS */}
        {activeTab === "reports" && (
          <div className="bg-[var(--card-bg)] rounded-2xl p-5 sm:p-6 border border-[var(--card-border)] shadow-xs">
            <h3 className="font-bold text-[var(--foreground)] mb-4">
              Produtos Mais Utilizados / Vendidos
            </h3>
            {topUsedProducts.length === 0 ? (
              <p className="text-sm text-[var(--muted)] py-6">
                Registre baixas ou conclua serviços vinculados a produtos para visualizar o ranking de consumo.
              </p>
            ) : (
              <div className="space-y-3">
                {topUsedProducts.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-3.5 rounded-xl bg-[var(--background)] border border-[var(--card-border)]"
                  >
                    <span className="font-semibold text-sm">
                      {idx + 1}. {item.name}
                    </span>
                    <span className="text-xs font-bold px-3 py-1 rounded-full bg-[var(--primary-light)] text-[var(--primary)] tabular-nums">
                      {item.totalOut} unidades baixadas
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Product Create/Edit Modal */}
      {showProductModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-[var(--card-bg)] rounded-3xl w-full max-w-lg p-5 sm:p-8 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg sm:text-xl font-bold text-[var(--foreground)]">
                {editingProduct ? "Editar Produto" : "Novo Produto / Insumo"}
              </h2>
              <button
                onClick={() => setShowProductModal(false)}
                className="p-2 rounded-full hover:bg-gray-100"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase text-[var(--muted)] mb-1">
                  Nome do Produto *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--card-border)] bg-[var(--background)] text-sm"
                  placeholder="Ex: Coloração 7.1 Louro Cinza / Esmalte Gel"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-[var(--muted)] mb-1">
                    Categoria
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        category: e.target.value as Product["category"],
                      })
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--card-border)] bg-[var(--background)] text-sm"
                  >
                    {PRODUCT_CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-[var(--muted)] mb-1">
                    Unidade
                  </label>
                  <select
                    value={formData.unit}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        unit: e.target.value as typeof formData.unit,
                      })
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--card-border)] bg-[var(--background)] text-sm"
                  >
                    <option value="un">Unidade (un)</option>
                    <option value="ml">Mililitros (ml)</option>
                    <option value="g">Gramas (g)</option>
                    <option value="kit">Kit</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-[var(--muted)] mb-1">
                    Quantidade Atual
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.quantity}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        quantity: Number(e.target.value),
                      })
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--card-border)] bg-[var(--background)] text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-[var(--muted)] mb-1">
                    Estoque Mínimo
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.minQuantity}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        minQuantity: Number(e.target.value),
                      })
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--card-border)] bg-[var(--background)] text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-[var(--muted)] mb-1">
                    Preço de Custo (R$)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.costPrice}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        costPrice: Number(e.target.value),
                      })
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--card-border)] bg-[var(--background)] text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-[var(--muted)] mb-1">
                    Preço de Venda (R$)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.salePrice}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        salePrice: Number(e.target.value),
                      })
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--card-border)] bg-[var(--background)] text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-[var(--muted)] mb-1">
                    Fornecedor
                  </label>
                  <input
                    type="text"
                    value={formData.supplier}
                    onChange={(e) =>
                      setFormData({ ...formData, supplier: e.target.value })
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--card-border)] bg-[var(--background)] text-sm"
                    placeholder="Ex: Distribuidora Beleza"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-[var(--muted)] mb-1">
                    Data de Validade
                  </label>
                  <input
                    type="date"
                    value={formData.expirationDate}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        expirationDate: e.target.value,
                      })
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--card-border)] bg-[var(--background)] text-sm"
                  />
                </div>
              </div>

              <label className="flex items-center gap-2 text-sm font-medium text-[var(--foreground)] cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.isForSale}
                  onChange={(e) =>
                    setFormData({ ...formData, isForSale: e.target.checked })
                  }
                  className="rounded text-[var(--primary)]"
                />
                Disponível também para revenda às clientes (Home Care)
              </label>

              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowProductModal(false)}
                  className="flex-1 py-3 rounded-xl border border-[var(--card-border)] text-sm font-semibold text-[var(--muted)]"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 rounded-xl bg-[var(--primary)] text-white text-sm font-bold"
                >
                  Salvar Produto
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Movement Modal */}
      {movementModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-[var(--card-bg)] rounded-3xl w-full max-w-md p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-[var(--foreground)] mb-1">
              {movementModal.type === "in"
                ? "Registrar Entrada de Estoque"
                : "Registrar Baixa / Saída"}
            </h3>
            <p className="text-xs text-[var(--muted)] mb-4">
              Produto: <strong>{movementModal.product.name}</strong> (Atual:{" "}
              {movementModal.product.quantity} {movementModal.product.unit})
            </p>
            <form onSubmit={handleConfirmMovement} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase text-[var(--muted)] mb-1">
                  Quantidade ({movementModal.product.unit})
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  value={movementQty}
                  onChange={(e) => setMovementQty(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--card-border)] bg-[var(--background)] text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase text-[var(--muted)] mb-1">
                  Motivo / Observação
                </label>
                <input
                  type="text"
                  value={movementReason}
                  onChange={(e) => setMovementReason(e.target.value)}
                  placeholder={
                    movementModal.type === "in"
                      ? "Ex: Nota fiscal fornecedor"
                      : "Ex: Utilizado em atendimento / Venda cliente"
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--card-border)] bg-[var(--background)] text-sm"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setMovementModal(null)}
                  className="flex-1 py-2.5 rounded-xl border border-[var(--card-border)] text-sm font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className={`flex-1 py-2.5 rounded-xl text-white text-sm font-bold ${
                    movementModal.type === "in"
                      ? "bg-emerald-600 hover:bg-emerald-700"
                      : "bg-rose-600 hover:bg-rose-700"
                  }`}
                >
                  Confirmar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
