"use client";

import { useState, useEffect, useCallback } from "react";
import ProtectedLayout from "@/components/ProtectedLayout";
import Modal from "@/components/Modal";
import { useToast } from "@/components/Toast";
import { api, formatMoney, formatDate, handleApiError } from "@/lib/api";
import { DEFAULT_CATEGORIES, PAYMENT_METHODS, RECURRING_FREQUENCIES } from "@/lib/constants";
import { useAuth } from "@/context/AuthContext";
import { FaPlus, FaEdit, FaTrash, FaPlay } from "react-icons/fa";

const initialForm = {
  title: "",
  amount: "",
  category: "Bills",
  frequency: "Monthly",
  startDate: new Date().toISOString().split("T")[0],
  endDate: "",
  paymentMethod: "Cash",
  active: true,
  description: "",
};

export default function RecurringPage() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(initialForm);
  const [customCats, setCustomCats] = useState([]);

  const categories = [...new Set([...DEFAULT_CATEGORIES, ...customCats])];

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("/recurring");
      setItems(res.data.recurringExpenses);
    } catch (e) {
      showToast(handleApiError(e), "error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

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
      const payload = {
        ...form,
        amount: Number(form.amount),
        endDate: form.endDate || undefined,
      };
      if (editing) {
        await api.put(`/recurring/${editing._id}`, payload);
        showToast("Recurring expense updated");
      } else {
        await api.post("/recurring", payload);
        showToast("Recurring expense created");
      }
      setModalOpen(false);
      setForm(initialForm);
      setEditing(null);
      fetchItems();
    } catch (e) {
      showToast(handleApiError(e), "error");
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this recurring expense?")) return;
    try {
      await api.delete(`/recurring/${id}`);
      showToast("Recurring expense deleted");
      fetchItems();
    } catch (e) {
      showToast(handleApiError(e), "error");
    }
  };

  const processDue = async () => {
    try {
      const res = await api.post("/recurring/process");
      showToast(`Processed ${res.data.processed} due payments`);
      fetchItems();
    } catch (e) {
      showToast(handleApiError(e), "error");
    }
  };

  const toggleActive = async (item) => {
    try {
      await api.put(`/recurring/${item._id}`, { active: !item.active });
      fetchItems();
    } catch (e) {
      showToast(handleApiError(e), "error");
    }
  };

  return (
    <ProtectedLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">
            Automatically create recurring expenses like rent, subscriptions, and EMIs.
          </p>
          <div className="flex gap-2">
            <button className="btn-outline" onClick={processDue}>
              <FaPlay /> Process Due
            </button>
            <button
              className="btn-primary"
              onClick={() => {
                setEditing(null);
                setForm(initialForm);
                setModalOpen(true);
              }}
            >
              <FaPlus /> Add Recurring
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-24">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary-600 border-t-transparent" />
          </div>
        ) : items.length === 0 ? (
          <div className="card py-16 text-center text-gray-500">
            <div className="mb-2 text-4xl">🔄</div>
            <p>No recurring expenses</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {items.map((item) => {
              const nextDue = new Date(item.nextPaymentDate);
              const today = new Date();
              const daysLeft = Math.ceil((nextDue - today) / (1000 * 60 * 60 * 24));
              return (
                <div
                  key={item._id}
                  className={`card ${!item.active ? "opacity-60" : ""}`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-gray-100">{item.title}</h3>
                      <p className="text-xs text-gray-500">
                        {item.category} · {item.frequency}
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => toggleActive(item)}
                        className={`rounded-full px-2.5 py-1 text-xs font-medium transition ${
                          item.active
                            ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                            : "bg-gray-100 text-gray-500 dark:bg-gray-800"
                        }`}
                      >
                        {item.active ? "Active" : "Paused"}
                      </button>
                    </div>
                  </div>

                  <p className="mt-3 text-2xl font-bold text-red-600 dark:text-red-400">
                    {formatMoney(item.amount, user?.currency)}
                  </p>

                  <div className="mt-3 space-y-1 border-t border-gray-100 pt-3 text-xs text-gray-500 dark:border-gray-800">
                    <div className="flex justify-between">
                      <span>Next Payment</span>
                      <span className="font-medium text-gray-700 dark:text-gray-300">
                        {formatDate(nextDue)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Due in</span>
                      <span className={daysLeft <= 3 ? "font-medium text-amber-600 dark:text-amber-400" : "font-medium text-gray-700 dark:text-gray-300"}>
                        {daysLeft <= 0 ? "Overdue" : `${daysLeft} days`}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Method</span>
                      <span className="font-medium text-gray-700 dark:text-gray-300">{item.paymentMethod}</span>
                    </div>
                  </div>

                  <div className="mt-3 flex justify-end gap-2">
                    <button
                      onClick={() => {
                        setEditing(item);
                        setForm({
                          title: item.title,
                          amount: String(item.amount),
                          category: item.category,
                          frequency: item.frequency,
                          startDate: new Date(item.startDate).toISOString().split("T")[0],
                          endDate: item.endDate ? new Date(item.endDate).toISOString().split("T")[0] : "",
                          paymentMethod: item.paymentMethod,
                          active: item.active,
                          description: item.description,
                        });
                        setModalOpen(true);
                      }}
                      className="rounded-lg p-2 text-gray-400 hover:bg-primary-50 hover:text-primary-600 dark:hover:bg-primary-900/30"
                    >
                      <FaEdit />
                    </button>
                    <button
                      onClick={() => handleDelete(item._id)}
                      className="rounded-lg p-2 text-gray-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/30"
                    >
                      <FaTrash />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <Modal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          title={editing ? "Edit Recurring Expense" : "Add Recurring Expense"}
          footer={
            <div className="flex justify-end gap-2">
              <button className="btn-outline" onClick={() => setModalOpen(false)}>Cancel</button>
              <button className="btn-primary" onClick={handleSubmit}>
                {editing ? "Update" : "Create"}
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
                <label className="label">Frequency *</label>
                <select
                  className="input"
                  value={form.frequency}
                  onChange={(e) => setForm({ ...form, frequency: e.target.value })}
                >
                  {RECURRING_FREQUENCIES.map((f) => (
                    <option key={f} value={f}>{f}</option>
                  ))}
                </select>
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
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Start Date *</label>
                <input
                  type="date"
                  className="input"
                  value={form.startDate}
                  onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="label">End Date (optional)</label>
                <input
                  type="date"
                  className="input"
                  value={form.endDate}
                  onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                />
              </div>
            </div>
            <div>
              <label className="label">Notes</label>
              <textarea
                className="input"
                rows="2"
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
