"use client";

import { useState, useEffect } from "react";
import ProtectedLayout from "@/components/ProtectedLayout";
import { api, formatMoney } from "@/lib/api";
import { CATEGORY_COLORS } from "@/lib/constants";
import { useAuth } from "@/context/AuthContext";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend,
} from "recharts";

const COLORS = [
  "#6366f1",
  "#ef4444",
  "#22c55e",
  "#f97316",
  "#06b6d4",
  "#8b5cf6",
  "#ec4899",
  "#eab308",
  "#14b8a6",
  "#64748b",
  "#84cc16",
  "#f43f5e",
];

export default function AnalyticsPage() {
  const { user } = useAuth();
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [year, setYear] = useState(new Date().getFullYear());

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const res = await api.get("/analytics", { params: { year } });
        setAnalytics(res.data.analytics);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [year]);

  if (loading || !analytics) {
    return (
      <ProtectedLayout>
        <div className="flex items-center justify-center py-32">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary-600 border-t-transparent" />
        </div>
      </ProtectedLayout>
    );
  }

  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const monthlyData = months.map((m, i) => ({
    name: m,
    expense: Math.round(analytics.monthlyExpense[i]),
    income: Math.round(analytics.monthlyIncome[i]),
  }));

  const dailyData = analytics.dailySpending.map((d) => ({
    name: `Day ${d.day}`,
    amount: Math.round(d.amount),
  }));

  const years = [];
  const currentYear = new Date().getFullYear();
  for (let y = currentYear; y >= currentYear - 4; y--) years.push(y);

  return (
    <ProtectedLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Expense Analytics {analytics.year}
            </h2>
            <p className="text-sm text-gray-500">
              {formatMoney(analytics.totalIncome, user?.currency)} income ·{" "}
              {formatMoney(analytics.totalExpense, user?.currency)} expenses
            </p>
          </div>
          <select className="input w-auto" value={year} onChange={(e) => setYear(Number(e.target.value))}>
            {years.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>

        {analytics.insights.length > 0 && (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {analytics.insights.map((insight, i) => (
              <div
                key={i}
                className="rounded-xl bg-gradient-to-r from-primary-50 to-indigo-50 p-4 text-sm text-primary-800 dark:from-primary-900/30 dark:to-indigo-900/30 dark:text-primary-300"
              >
                💡 {insight}
              </div>
            ))}
          </div>
        )}

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="card">
            <h3 className="mb-4 text-base font-semibold text-gray-900 dark:text-gray-100">
              Income vs Expenses
            </h3>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip
                    formatter={(value) => formatMoney(value, user?.currency)}
                    contentStyle={{ borderRadius: 12 }}
                  />
                  <Legend />
                  <Bar dataKey="income" name="Income" fill="#22c55e" radius={[4,4,0,0]} />
                  <Bar dataKey="expense" name="Expense" fill="#6366f1" radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="card">
            <h3 className="mb-4 text-base font-semibold text-gray-900 dark:text-gray-100">
              Category-wise Expenses
            </h3>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={analytics.categoryExpenses}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    label={(entry) => entry.name}
                  >
                    {analytics.categoryExpenses.map((entry, idx) => (
                      <Cell
                        key={`cell-${idx}`}
                        fill={CATEGORY_COLORS[entry.name] || COLORS[idx % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value) => formatMoney(value, user?.currency)}
                    contentStyle={{ borderRadius: 12 }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="card">
            <h3 className="mb-4 text-base font-semibold text-gray-900 dark:text-gray-100">
              Savings Trend
            </h3>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip
                    formatter={(value) => formatMoney(value, user?.currency)}
                    contentStyle={{ borderRadius: 12 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="expense"
                    name="Cumulative"
                    stroke="#8b5cf6"
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {dailyData.length > 0 && (
            <div className="card">
              <h3 className="mb-4 text-base font-semibold text-gray-900 dark:text-gray-100">
                Daily Spending (This Month)
              </h3>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={dailyData}>
                    <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
                    <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip
                      formatter={(value) => formatMoney(value, user?.currency)}
                      contentStyle={{ borderRadius: 12 }}
                    />
                    <Bar dataKey="amount" name="Amount" fill="#f97316" radius={[4,4,0,0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>

        <div className="card">
          <h3 className="mb-4 text-base font-semibold text-gray-900 dark:text-gray-100">
            Category Breakdown
          </h3>
          <div className="space-y-3">
            {analytics.categoryExpenses.map((cat) => {
              const pct = analytics.totalExpense > 0 ? (cat.value / analytics.totalExpense) * 100 : 0;
              return (
                <div key={cat.name}>
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <span className="font-medium text-gray-700 dark:text-gray-300">{cat.name}</span>
                    <span className="text-gray-600 dark:text-gray-400">
                      {formatMoney(Math.round(cat.value), user?.currency)} ({Math.round(pct)}%)
                    </span>
                  </div>
                  <div className="h-2.5 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${pct}%`,
                        backgroundColor: CATEGORY_COLORS[cat.name] || "#6366f1",
                      }}
                    />
                  </div>
                </div>
              );
            })}
            {analytics.categoryExpenses.length === 0 && (
              <p className="py-8 text-center text-sm text-gray-500">No expense data for {year}</p>
            )}
          </div>
        </div>
      </div>
    </ProtectedLayout>
  );
}
