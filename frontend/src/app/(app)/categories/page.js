"use client";

import { useState, useEffect, useCallback } from "react";
import ProtectedLayout from "@/components/ProtectedLayout";
import Modal from "@/components/Modal";
import { useToast } from "@/components/Toast";
import { api, handleApiError } from "@/lib/api";
import { FaPlus, FaEdit, FaTrash } from "react-icons/fa";

const ICONS = ["📁", "🏋️", "🎬", "🎓", "⛽", "🏠", "💳", "📺", "☕", "🎮", "👕", "🐶", "✈️", "📱", "⚡", "🌱"];
const COLORS = ["#6366f1", "#ef4444", "#22c55e", "#f97316", "#06b6d4", "#8b5cf6", "#ec4899", "#eab308"];

const initialForm = {
  name: "",
  icon: "📁",
  type: "expense",
  color: "#6366f1",
};

export default function CategoriesPage() {
  const { showToast } = useToast();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(initialForm);

  const fetchCategories = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("/categories");
      setCategories(res.data.categories);
    } catch (e) {
      showToast(handleApiError(e), "error");
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editing) {
        await api.put(`/categories/${editing._id}`, form);
        showToast("Category updated");
      } else {
        await api.post("/categories", form);
        showToast("Category created");
      }
      setModalOpen(false);
      setForm(initialForm);
      setEditing(null);
      fetchCategories();
    } catch (e) {
      showToast(handleApiError(e), "error");
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this category?")) return;
    try {
      await api.delete(`/categories/${id}`);
      showToast("Category deleted");
      fetchCategories();
    } catch (e) {
      showToast(handleApiError(e), "error");
    }
  };

  const expenseCats = categories.filter((c) => c.type === "expense");
  const incomeCats = categories.filter((c) => c.type === "income");

  return (
    <ProtectedLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">
            Create custom categories beyond the defaults, like Gym, Netflix, Petrol, or EMI.
          </p>
          <button
            className="btn-primary"
            onClick={() => {
              setEditing(null);
              setForm(initialForm);
              setModalOpen(true);
            }}
          >
            <FaPlus /> New Category
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-24">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary-600 border-t-transparent" />
          </div>
        ) : categories.length === 0 ? (
          <div className="card py-16 text-center text-gray-500">
            <div className="mb-2 text-4xl">🏷️</div>
            <p>No custom categories yet</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[...expenseCats, ...incomeCats].map((c) => (
              <div key={c._id} className="card flex items-center gap-3">
                <div
                  className="flex h-12 w-12 items-center justify-center rounded-xl text-2xl"
                  style={{ backgroundColor: `${c.color}20` }}
                >
                  {c.icon}
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-gray-900 dark:text-gray-100">{c.name}</p>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      c.type === "expense"
                        ? "bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400"
                        : "bg-green-50 text-green-600 dark:bg-green-900/30 dark:text-green-400"
                    }`}
                  >
                    {c.type === "expense" ? "Expense" : "Income"}
                  </span>
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => {
                      setEditing(c);
                      setForm({ name: c.name, icon: c.icon, type: c.type, color: c.color });
                      setModalOpen(true);
                    }}
                    className="rounded-lg p-2 text-gray-400 hover:bg-primary-50 hover:text-primary-600 dark:hover:bg-primary-900/30"
                  >
                    <FaEdit />
                  </button>
                  <button
                    onClick={() => handleDelete(c._id)}
                    className="rounded-lg p-2 text-gray-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/30"
                  >
                    <FaTrash />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        <Modal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          title={editing ? "Edit Category" : "Create Category"}
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
              <label className="label">Category Name *</label>
              <input
                className="input"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
                placeholder="e.g. Gym, Netflix, Petrol"
              />
            </div>
            <div>
              <label className="label">Type</label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setForm({ ...form, type: "expense" })}
                  className={`flex-1 rounded-xl border px-4 py-2 text-sm font-medium transition ${
                    form.type === "expense"
                      ? "border-red-500 bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                      : "border-gray-300 text-gray-500 dark:border-gray-700"
                  }`}
                >
                  Expense
                </button>
                <button
                  type="button"
                  onClick={() => setForm({ ...form, type: "income" })}
                  className={`flex-1 rounded-xl border px-4 py-2 text-sm font-medium transition ${
                    form.type === "income"
                      ? "border-green-500 bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                      : "border-gray-300 text-gray-500 dark:border-gray-700"
                  }`}
                >
                  Income
                </button>
              </div>
            </div>
            <div>
              <label className="label">Choose Icon</label>
              <div className="flex flex-wrap gap-2">
                {ICONS.map((icon) => (
                  <button
                    key={icon}
                    type="button"
                    onClick={() => setForm({ ...form, icon })}
                    className={`rounded-lg p-2 text-xl transition ${
                      form.icon === icon
                        ? "bg-primary-100 ring-2 ring-primary-500 dark:bg-primary-900/40"
                        : "bg-gray-50 hover:bg-gray-100 dark:bg-gray-800 dark:hover:bg-gray-700"
                    }`}
                  >
                    {icon}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="label">Color</label>
              <div className="flex flex-wrap gap-2">
                {COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setForm({ ...form, color })}
                    className={`h-8 w-8 rounded-full transition ${
                      form.color === color ? "ring-2 ring-offset-2" : ""
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>
          </form>
        </Modal>
      </div>
    </ProtectedLayout>
  );
}
