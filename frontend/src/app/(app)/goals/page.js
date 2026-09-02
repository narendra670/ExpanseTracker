"use client";

import { useState, useEffect, useCallback } from "react";
import ProtectedLayout from "@/components/ProtectedLayout";
import Modal from "@/components/Modal";
import { useToast } from "@/components/Toast";
import { api, formatMoney, formatDate, handleApiError } from "@/lib/api";
import { GOAL_ICONS, GOAL_COLORS } from "@/lib/constants";
import { useAuth } from "@/context/AuthContext";
import { FaPlus, FaEdit, FaTrash, FaPlusCircle } from "react-icons/fa";

const initialForm = {
  title: "",
  targetAmount: "",
  savedAmount: "0",
  targetDate: "",
  icon: "🎯",
  color: "#6366f1",
  description: "",
};

export default function GoalsPage() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [addAmount, setAddAmount] = useState("");
  const [activeGoal, setActiveGoal] = useState(null);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(initialForm);

  const fetchGoals = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("/goals");
      setGoals(res.data.goals);
    } catch (e) {
      showToast(handleApiError(e), "error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchGoals();
  }, [fetchGoals]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editing) {
        await api.put(`/goals/${editing._id}`, {
          ...form,
          targetAmount: Number(form.targetAmount),
          savedAmount: Number(form.savedAmount),
          targetDate: form.targetDate || undefined,
        });
        showToast("Goal updated");
      } else {
        await api.post("/goals", {
          ...form,
          targetAmount: Number(form.targetAmount),
          savedAmount: Number(form.savedAmount),
          targetDate: form.targetDate || undefined,
        });
        showToast("Goal created");
      }
      setModalOpen(false);
      setForm(initialForm);
      setEditing(null);
      fetchGoals();
    } catch (e) {
      showToast(handleApiError(e), "error");
    }
  };

  const handleAdd = async () => {
    if (!addAmount || !activeGoal) return;
    try {
      await api.post(`/goals/${activeGoal._id}/add`, { amount: Number(addAmount) });
      showToast("Added to goal");
      setAddModalOpen(false);
      setAddAmount("");
      fetchGoals();
    } catch (e) {
      showToast(handleApiError(e), "error");
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this goal?")) return;
    try {
      await api.delete(`/goals/${id}`);
      showToast("Goal deleted");
      fetchGoals();
    } catch (e) {
      showToast(handleApiError(e), "error");
    }
  };

  return (
    <ProtectedLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">
            Set financial goals and track your progress toward them.
          </p>
          <button
            className="btn-primary"
            onClick={() => {
              setEditing(null);
              setForm(initialForm);
              setModalOpen(true);
            }}
          >
            <FaPlus /> Add Goal
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-24">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary-600 border-t-transparent" />
          </div>
        ) : goals.length === 0 ? (
          <div className="card py-16 text-center text-gray-500">
            <div className="mb-2 text-4xl">🎯</div>
            <p>No goals yet</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {goals.map((g) => {
              const pct = Math.min(100, g.progress);
              const completed = g.status === "completed";
              return (
                <div key={g._id} className="card">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className="flex h-12 w-12 items-center justify-center rounded-xl text-2xl"
                        style={{ backgroundColor: `${g.color}20` }}
                      >
                        {g.icon}
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900 dark:text-gray-100">{g.title}</h3>
                        <p className="text-xs text-gray-500">
                          {formatMoney(g.savedAmount, user?.currency)} of{" "}
                          {formatMoney(g.targetAmount, user?.currency)}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => {
                          setEditing(g);
                          setForm({
                            title: g.title,
                            targetAmount: String(g.targetAmount),
                            savedAmount: String(g.savedAmount),
                            targetDate: g.targetDate ? new Date(g.targetDate).toISOString().split("T")[0] : "",
                            icon: g.icon,
                            color: g.color,
                            description: g.description,
                          });
                          setModalOpen(true);
                        }}
                        className="rounded-lg p-2 text-gray-400 hover:bg-primary-50 hover:text-primary-600 dark:hover:bg-primary-900/30"
                      >
                        <FaEdit />
                      </button>
                      <button
                        onClick={() => handleDelete(g._id)}
                        className="rounded-lg p-2 text-gray-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/30"
                      >
                        <FaTrash />
                      </button>
                    </div>
                  </div>

                  <div className="mt-4">
                    <div className="h-3 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{ width: `${pct}%`, backgroundColor: g.color }}
                      />
                    </div>
                    <div className="mt-2 flex items-center justify-between text-sm">
                      <span className="font-semibold text-gray-900 dark:text-gray-100">
                        {completed ? "🏆 Completed" : `${Math.round(pct)}%`}
                      </span>
                      {g.targetDate && (
                        <span className="text-xs text-gray-500">
                          by {formatDate(g.targetDate)}
                        </span>
                      )}
                    </div>
                  </div>

                  {!completed && (
                    <button
                      className="btn-outline mt-4 w-full"
                      onClick={() => {
                        setActiveGoal(g);
                        setAddAmount("");
                        setAddModalOpen(true);
                      }}
                    >
                      <FaPlusCircle /> Add Money
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}

        <Modal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          title={editing ? "Edit Goal" : "Add Goal"}
          footer={
            <div className="flex justify-end gap-2">
              <button className="btn-outline" onClick={() => setModalOpen(false)}>Cancel</button>
              <button className="btn-primary" onClick={handleSubmit}>
                {editing ? "Update" : "Create"} Goal
              </button>
            </div>
          }
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Goal Title *</label>
              <input
                className="input"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                required
                placeholder="e.g. Buy a Laptop"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Target Amount *</label>
                <input
                  type="number"
                  className="input"
                  value={form.targetAmount}
                  onChange={(e) => setForm({ ...form, targetAmount: e.target.value })}
                  required
                  min="0"
                />
              </div>
              <div>
                <label className="label">Already Saved</label>
                <input
                  type="number"
                  className="input"
                  value={form.savedAmount}
                  onChange={(e) => setForm({ ...form, savedAmount: e.target.value })}
                  min="0"
                />
              </div>
            </div>
            <div>
              <label className="label">Target Date (optional)</label>
              <input
                type="date"
                className="input"
                value={form.targetDate}
                onChange={(e) => setForm({ ...form, targetDate: e.target.value })}
              />
            </div>
            <div>
              <label className="label">Icon</label>
              <div className="flex flex-wrap gap-2">
                {GOAL_ICONS.map((icon) => (
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
                {GOAL_COLORS.map((color) => (
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
            <div>
              <label className="label">Description</label>
              <textarea
                className="input"
                rows="2"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </div>
          </form>
        </Modal>

        <Modal
          open={addModalOpen}
          onClose={() => setAddModalOpen(false)}
          title={`Add to ${activeGoal?.title || "Goal"}`}
          footer={
            <div className="flex justify-end gap-2">
              <button className="btn-outline" onClick={() => setAddModalOpen(false)}>Cancel</button>
              <button className="btn-primary" onClick={handleAdd}>Add</button>
            </div>
          }
        >
          <div className="space-y-4">
            <div>
              <label className="label">Amount to add</label>
              <input
                type="number"
                className="input"
                value={addAmount}
                onChange={(e) => setAddAmount(e.target.value)}
                min="0"
                required
              />
            </div>
          </div>
        </Modal>
      </div>
    </ProtectedLayout>
  );
}
