"use client";

import { useState, useEffect, useCallback } from "react";
import ProtectedLayout from "@/components/ProtectedLayout";
import Modal from "@/components/Modal";
import { useToast } from "@/components/Toast";
import { api, formatMoney, handleApiError } from "@/lib/api";
import { DEFAULT_CATEGORIES } from "@/lib/constants";
import { useAuth } from "@/context/AuthContext";
import { FaPlus, FaEdit, FaTrash } from "react-icons/fa";

const getMonthStr = (d = new Date()) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;

export default function BudgetsPage() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [budgets, setBudgets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [month, setMonth] = useState(getMonthStr());
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ category: "Food", limit: "", description: "" });
  const [customCats, setCustomCats] = useState([]);

  const categories = [...new Set([...DEFAULT_CATEGORIES, ...customCats])];

  const fetchBudgets = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("/budgets", { params: { month } });
      setBudgets(res.data.budgets);
    } catch (e) {
      showToast(handleApiError(e), "error");
    } finally {
      setLoading(false);
    }
  }, [month]);

  useEffect(() => {
    fetchBudgets();
  }, [fetchBudgets]);

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get("/categories", { params: { type: "expense" } });
        setCustomCats(res.data.categories.map((c) => c.name));
      } catch (e) {}
    })();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...form, limit: Number(form.limit), month };
      if (editing) {
        await api.put(`/budgets/${editing._id}`, payload);
        showToast("Budget updated");
      } else {
        await api.post("/budgets", payload);
        showToast("Budget created");
      }
      setModalOpen(false);
      setForm({ category: "Food", limit: "", description: "" });
      setEditing(null);
      fetchBudgets();
    } catch (e) {
      showToast(handleApiError(e), "error");
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this budget?")) return;
    try {
      await api.delete(`/budgets/${id}`);
      showToast("Budget deleted");
      fetchBudgets();
    } catch (e) {
      showToast(handleApiError(e), "error");
    }
  };

  const totalLimit = budgets.reduce((s, b) => s + b.limit, 0);
  const totalSpent = budgets.reduce((s, b) => s + b.spent, 0);

  return (
    <ProtectedLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <input
              type="month"
              className="input w-auto"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
            />
            <div className="text-sm text-gray-500">
              {budgets.length} budgets ·{" "}
              <span className="font-semibold text-gray-900 dark:text-gray-100">
                {formatMoney(totalSpent, user?.currency)}
              </span>{" "}
              / {formatMoney(totalLimit, user?.currency)}
            </div>
          </div>
          <button
            className="btn-primary"
            onClick={() => {
              setEditing(null);
              setForm({ category: "Food", limit: "", description: "" });
              setModalOpen(true);
            }}
          >
            <FaPlus /> Add Budget
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-24">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary-600 border-t-transparent" />
          </div>
        ) : budgets.length === 0 ? (
          <div className="card py-16 text-center text-gray-500">
            <div className="mb-2 text-4xl">🎯</div>
            <p>No budgets set for {month}</p>
            <button className="btn-primary mt-4" onClick={() => setModalOpen(true)}>
              Create your first budget
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {budgets.map((b) => {
              const pct = Math.min(100, b.percentage);
              const color =
                b.exceedsBudget
                  ? "bg-red-500"
                  : b.warning
                  ? "bg-amber-500"
                  : "bg-primary-500";
              return (
                <div key={b._id} className="card">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-gray-100">{b.category}</h3>
                      <p className="text-xs text-gray-500">{b.description}</p>
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => {
                          setEditing(b);
                          setForm({ category: b.category, limit: String(b.limit), description: b.description });
                          setModalOpen(true);
                        }}
                        className="rounded-lg p-2 text-gray-400 hover:bg-primary-50 hover:text-primary-600 dark:hover:bg-primary-900/30"
                      >
                        <FaEdit />
                      </button>
                      <button
                        onClick={() => handleDelete(b._id)}
                        className="rounded-lg p-2 text-gray-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/30"
                      >
                        <FaTrash />
                      </button>
                    </div>
                  </div>

                  <div className="mt-4">
                    <div className="h-3 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
                      <div
                        className={`h-full rounded-full transition-all ${color}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <div className="mt-2 flex items-center justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">
                        {formatMoney(b.spent, user?.currency)} spent
                      </span>
                      <span className="font-medium text-gray-900 dark:text-gray-100">
                        {b.percentage}%
                      </span>
                    </div>
                    <div className="mt-1 flex items-center justify-between text-xs text-gray-500">
                      <span>of {formatMoney(b.limit, user?.currency)}</span>
                      <span>
                        Remaining:{" "}
                        <span className={b.remaining < 0 ? "text-red-500" : "text-green-500"}>
                          {formatMoney(b.remaining, user?.currency)}
                        </span>
                      </span>
                    </div>
                  </div>

                  {b.exceedsBudget && (
                    <div className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-xs font-medium text-red-600 dark:bg-red-900/30 dark:text-red-400">
                      🚨 Budget exceeded!
                    </div>
                  )}
                  {b.warning && !b.exceedsBudget && (
                    <div className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-xs font-medium text-amber-600 dark:bg-amber-900/30 dark:text-amber-400">
                      ⚠️ {b.percentage}% used — approaching limit
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        <Modal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          title={editing ? "Edit Budget" : "Add Budget"}
          footer={
            <div className="flex justify-end gap-2">
              <button className="btn-outline" onClick={() => setModalOpen(false)}>Cancel</button>
              <button className="btn-primary" onClick={handleSubmit}>
                {editing ? "Update" : "Create"} Budget
              </button>
            </div>
          }
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Category *</label>
              <select
                className="input"
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
              >
                {categories.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Monthly Limit *</label>
              <input
                type="number"
                className="input"
                value={form.limit}
                onChange={(e) => setForm({ ...form, limit: e.target.value })}
                required
                min="0"
                placeholder="e.g. 8000"
              />
            </div>
            <div>
              <label className="label">Description</label>
              <input
                className="input"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </div>
          </form>
        </Modal>
      </div>
    </ProtectedLayout>
  );
}
