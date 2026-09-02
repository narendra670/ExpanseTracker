"use client";

import { useState, useEffect, useCallback } from "react";
import ProtectedLayout from "@/components/ProtectedLayout";
import Modal from "@/components/Modal";
import { useToast } from "@/components/Toast";
import { api, formatMoney, formatDate, handleApiError } from "@/lib/api";
import {
  DEFAULT_CATEGORIES,
  PAYMENT_METHODS,
  CATEGORY_ICONS,
} from "@/lib/constants";
import { useAuth } from "@/context/AuthContext";
import { FaPlus, FaEdit, FaTrash, FaSearch } from "react-icons/fa";

const initialForm = {
  title: "",
  amount: "",
  category: "Food",
  date: new Date().toISOString().split("T")[0],
  paymentMethod: "Cash",
  description: "",
  notes: "",
};

export default function ExpensesPage() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [filterMethod, setFilterMethod] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(initialForm);
  const [pag, setPag] = useState({ page: 1, totalPages: 1, total: 0 });
  const [customCategories, setCustomCategories] = useState([]);

  const categories = [...new Set([...DEFAULT_CATEGORIES, ...customCategories])];

  const fetchExpenses = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const params = { page, limit: 20 };
      if (search) params.search = search;
      if (filterCategory) params.category = filterCategory;
      if (filterMethod) params.paymentMethod = filterMethod;
      const res = await api.get("/expenses", { params });
      setExpenses(res.data.expenses);
      setPag(res.data.pagination);
    } catch (e) {
      showToast(handleApiError(e), "error");
    } finally {
      setLoading(false);
    }
  }, [search, filterCategory, filterMethod]);

  const fetchCategories = async () => {
    try {
      const res = await api.get("/categories", { params: { type: "expense" } });
      setCustomCategories(res.data.categories.map((c) => c.name));
    } catch (e) {}
  };

  useEffect(() => {
    fetchExpenses(pag.page);
  }, [pag.page, search, filterCategory, filterMethod]);

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editing) {
        await api.put(`/expenses/${editing._id}`, {
          ...form,
          amount: Number(form.amount),
        });
        showToast("Expense updated");
      } else {
        await api.post("/expenses", {
          ...form,
          amount: Number(form.amount),
        });
        showToast("Expense added");
      }
      setModalOpen(false);
      setForm(initialForm);
      setEditing(null);
      fetchExpenses(pag.page);
    } catch (e) {
      showToast(handleApiError(e), "error");
    }
  };

  const handleEdit = (expense) => {
    setEditing(expense);
    setForm({
      title: expense.title,
      amount: String(expense.amount),
      category: expense.category,
      date: new Date(expense.date).toISOString().split("T")[0],
      paymentMethod: expense.paymentMethod,
      description: expense.description,
      notes: expense.notes,
    });
    setModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this expense?")) return;
    try {
      await api.delete(`/expenses/${id}`);
      showToast("Expense deleted");
      fetchExpenses(pag.page);
    } catch (e) {
      showToast(handleApiError(e), "error");
    }
  };

  return (
    <ProtectedLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-1 flex-wrap gap-3">
            <div className="relative">
              <FaSearch className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <input
                className="input pl-9"
                placeholder="Search expenses..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPag((p) => ({ ...p, page: 1 }));
                }}
              />
            </div>
            <select
              className="input w-auto"
              value={filterCategory}
              onChange={(e) => {
                setFilterCategory(e.target.value);
                setPag((p) => ({ ...p, page: 1 }));
              }}
            >
              <option value="">All Categories</option>
              {categories.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            <select
              className="input w-auto"
              value={filterMethod}
              onChange={(e) => {
                setFilterMethod(e.target.value);
                setPag((p) => ({ ...p, page: 1 }));
              }}
            >
              <option value="">All Methods</option>
              {PAYMENT_METHODS.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>
          <button
            className="btn-primary"
            onClick={() => {
              setEditing(null);
              setForm(initialForm);
              setModalOpen(true);
            }}
          >
            <FaPlus /> Add Expense
          </button>
        </div>

        <div className="card overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-4 py-3 font-semibold text-gray-600 dark:text-gray-300">Title</th>
                  <th className="px-4 py-3 font-semibold text-gray-600 dark:text-gray-300">Category</th>
                  <th className="px-4 py-3 font-semibold text-gray-600 dark:text-gray-300">Date</th>
                  <th className="px-4 py-3 font-semibold text-gray-600 dark:text-gray-300">Payment</th>
                  <th className="px-4 py-3 text-right font-semibold text-gray-600 dark:text-gray-300">Amount</th>
                  <th className="px-4 py-3 text-right font-semibold text-gray-600 dark:text-gray-300">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {expenses.map((e) => (
                  <tr key={e._id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{CATEGORY_ICONS[e.category] || "📁"}</span>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-gray-100">{e.title}</p>
                          {e.description && (
                            <p className="text-xs text-gray-500">{e.description}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                        {e.category}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500">{formatDate(e.date)}</td>
                    <td className="px-4 py-3 text-gray-500">{e.paymentMethod}</td>
                    <td className="px-4 py-3 text-right font-semibold text-red-600 dark:text-red-400">
                      -{formatMoney(e.amount, user?.currency)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => handleEdit(e)}
                          className="rounded-lg p-2 text-gray-400 hover:bg-primary-50 hover:text-primary-600 dark:hover:bg-primary-900/30"
                        >
                          <FaEdit />
                        </button>
                        <button
                          onClick={() => handleDelete(e._id)}
                          className="rounded-lg p-2 text-gray-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/30"
                        >
                          <FaTrash />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {expenses.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center text-gray-500">
                      No expenses found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {pag.totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-gray-100 px-4 py-3 dark:border-gray-800">
              <p className="text-sm text-gray-500">
                Showing {expenses.length} of {pag.total} expenses
              </p>
              <div className="flex gap-2">
                <button
                  className="btn-outline px-3 py-1.5"
                  disabled={pag.page <= 1}
                  onClick={() => setPag((p) => ({ ...p, page: p.page - 1 }))}
                >
                  Prev
                </button>
                <span className="flex items-center px-2 text-sm text-gray-500">
                  {pag.page} / {pag.totalPages}
                </span>
                <button
                  className="btn-outline px-3 py-1.5"
                  disabled={pag.page >= pag.totalPages}
                  onClick={() => setPag((p) => ({ ...p, page: p.page + 1 }))}
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>

        <Modal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          title={editing ? "Edit Expense" : "Add Expense"}
          footer={
            <div className="flex justify-end gap-2">
              <button className="btn-outline" onClick={() => setModalOpen(false)}>
                Cancel
              </button>
              <button className="btn-primary" onClick={handleSubmit}>
                {editing ? "Update" : "Add"} Expense
              </button>
            </div>
          }
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Title *</label>
              <input
                className="input"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Amount *</label>
                <input
                  type="number"
                  className="input"
                  value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: e.target.value })}
                  required
                  min="0"
                />
              </div>
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
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Date</label>
                <input
                  type="date"
                  className="input"
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                />
              </div>
              <div>
                <label className="label">Payment Method</label>
                <select
                  className="input"
                  value={form.paymentMethod}
                  onChange={(e) => setForm({ ...form, paymentMethod: e.target.value })}
                >
                  {PAYMENT_METHODS.map((m) => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="label">Description</label>
              <input
                className="input"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </div>
            <div>
              <label className="label">Notes</label>
              <textarea
                className="input"
                rows="3"
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
              />
            </div>
          </form>
        </Modal>
      </div>
    </ProtectedLayout>
  );
}
