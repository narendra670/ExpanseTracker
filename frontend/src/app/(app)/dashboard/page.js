"use client";

import { useState, useEffect } from "react";
import ProtectedLayout from "@/components/ProtectedLayout";
import { api, formatMoney, formatDateShort } from "@/lib/api";
import { CATEGORY_ICONS, CATEGORY_COLORS } from "@/lib/constants";
import { useAuth } from "@/context/AuthContext";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend,
} from "recharts";
import {
  FaArrowUp,
  FaArrowDown,
  FaWallet,
  FaPiggyBank,
} from "react-icons/fa";

export default function DashboardPage() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [monthly, setMonthly] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [dashRes, analyticsRes, alertsRes] = await Promise.all([
          api.get("/dashboard"),
          api.get("/analytics"),
          api.get("/alerts"),
        ]);
        setData(dashRes.data.dashboard);
        setAlerts(alertsRes.data.alerts || []);

        const exp = analyticsRes.data.analytics.monthlyExpense;
        const inc = analyticsRes.data.analytics.monthlyIncome;
        const names = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
        setMonthly(
          names.map((n, i) => ({
            name: n,
            expense: Math.round(exp[i]),
            income: Math.round(inc[i]),
          }))
        );
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading || !data) {
    return (
      <ProtectedLayout>
        <div className="flex items-center justify-center py-32">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary-600 border-t-transparent" />
        </div>
      </ProtectedLayout>
    );
  }

  const stats = [
    {
      label: "Total Balance",
      value: data.totalBalance,
      icon: FaWallet,
      color: "from-indigo-500 to-blue-500",
    },
    {
      label: "Total Income",
      value: data.totalIncome,
      icon: FaArrowUp,
      color: "from-green-500 to-emerald-500",
    },
    {
      label: "Total Expenses",
      value: data.totalExpense,
      icon: FaArrowDown,
      color: "from-red-500 to-rose-500",
    },
    {
      label: "Total Savings",
      value: data.totalSavings,
      icon: FaPiggyBank,
      color: "from-amber-500 to-orange-500",
    },
  ];

  return (
    <ProtectedLayout>
      <div className="space-y-6">
        {alerts.length > 0 && (
          <div className="space-y-2">
            {alerts.map((a, i) => (
              <div
                key={i}
                className={`rounded-xl px-4 py-3 text-sm font-medium ${
                  a.type === "danger"
                    ? "bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                    : a.type === "warning"
                    ? "bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                    : "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                }`}
              >
                {a.type === "danger" ? "🚨 " : a.type === "warning" ? "⚠️ " : "ℹ️ "}
                {a.message}
              </div>
            ))}
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((s) => (
            <div key={s.label} className="card">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-500 dark:text-gray-400">{s.label}</p>
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${s.color} text-white`}
                >
                  <s.icon />
                </div>
              </div>
              <p className="mt-3 text-2xl font-bold text-gray-900 dark:text-gray-100">
                {formatMoney(s.value, user?.currency)}
              </p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="card lg:col-span-2">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Monthly Overview
              </h2>
              <div className="flex gap-4 text-xs">
                <span className="flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-primary-600" /> Expense
                </span>
                <span className="flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-green-500" /> Income
                </span>
              </div>
            </div>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthly}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" strokeOpacity={0.2} />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip
                    formatter={(value) => formatMoney(value, user?.currency)}
                    contentStyle={{
                      borderRadius: 12,
                      border: "1px solid rgba(100,116,139,0.2)",
                    }}
                  />
                  <Bar dataKey="expense" fill="#6366f1" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="income" fill="#22c55e" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="card">
            <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-gray-100">
              Recent Transactions
            </h2>
            <div className="space-y-3">
              {data.recentTransactions.map((t) => (
                <div
                  key={t.id}
                  className="flex items-center gap-3 rounded-xl p-2 hover:bg-gray-50 dark:hover:bg-gray-800"
                >
                  <div
                    className={`flex h-9 w-9 items-center justify-center rounded-lg text-sm ${
                      t.type === "expense"
                        ? "bg-red-50 dark:bg-red-900/30"
                        : "bg-green-50 dark:bg-green-900/30"
                    }`}
                  >
                    {CATEGORY_ICONS[t.category] || "📁"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="truncate text-sm font-medium text-gray-900 dark:text-gray-100">
                      {t.title}
                    </p>
                    <p className="text-xs text-gray-500">
                      {t.category} · {formatDateShort(t.date)}
                    </p>
                  </div>
                  <p
                    className={`text-sm font-semibold ${
                      t.type === "expense"
                        ? "text-red-600 dark:text-red-400"
                        : "text-green-600 dark:text-green-400"
                    }`}
                  >
                    {t.type === "expense" ? "-" : "+"}
                    {formatMoney(t.amount, user?.currency)}
                  </p>
                </div>
              ))}
              {data.recentTransactions.length === 0 && (
                <p className="py-8 text-center text-sm text-gray-500">
                  No transactions yet
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="card lg:col-span-2">
            <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-gray-100">
              Savings Trend
            </h2>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={monthly}>
                  <defs>
                    <linearGradient id="savings" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip
                    formatter={(value) => formatMoney(value, user?.currency)}
                    contentStyle={{ borderRadius: 12 }}
                  />
                  <Area
                    type="monotone"
                    dataKey="expense"
                    stroke="#6366f1"
                    fill="url(#savings)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="card">
            <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-gray-100">
              This Month
            </h2>
            <div className="space-y-4">
              {[
                { label: "Monthly Income", value: data.monthlyIncome, color: "text-green-600" },
                { label: "Monthly Expenses", value: data.monthlyExpense, color: "text-red-600" },
                { label: "Monthly Savings", value: data.monthlySavings, color: "text-primary-600" },
              ].map((m) => (
                <div key={m.label} className="flex items-center justify-between border-b border-gray-100 pb-3 last:border-0 dark:border-gray-800">
                  <span className="text-sm text-gray-500">{m.label}</span>
                  <span className={`font-semibold ${m.color}`}>
                    {formatMoney(m.value, user?.currency)}
                  </span>
                </div>
              ))}
              {data.expenseChange !== 0 && (
                <div
                  className={`rounded-xl px-4 py-3 text-sm font-medium ${
                    data.expenseChange > 0
                      ? "bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                      : "bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                  }`}
                >
                  {data.expenseChange > 0 ? "▲" : "▼"} Expenses {Math.abs(data.expenseChange)}%
                  {data.expenseChange > 0 ? " higher" : " lower"} than last month
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </ProtectedLayout>
  );
}
