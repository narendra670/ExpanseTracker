"use client";

import { useState, useEffect, useCallback } from "react";
import ProtectedLayout from "@/components/ProtectedLayout";
import { useToast } from "@/components/Toast";
import { api, formatMoney, formatDate, handleApiError } from "@/lib/api";
import {
  DEFAULT_CATEGORIES,
  PAYMENT_METHODS,
  CATEGORY_ICONS,
} from "@/lib/constants";
import { useAuth } from "@/context/AuthContext";
import { FaSearch, FaDownload } from "react-icons/fa";

export default function TransactionsPage() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [type, setType] = useState("");
  const [category, setCategory] = useState("");
  const [method, setMethod] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [pag, setPag] = useState({ page: 1, totalPages: 1, total: 0 });
  const [customCats, setCustomCats] = useState([]);

  const categories = [...new Set([...DEFAULT_CATEGORIES, ...customCats])];

  const fetchTransactions = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const params = { page, limit: 15 };
      if (search) params.search = search;
      if (type) params.type = type;
      if (category) params.category = category;
      if (method) params.paymentMethod = method;
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      const res = await api.get("/transactions", { params });
      setTransactions(res.data.transactions);
      setPag(res.data.pagination);
    } catch (e) {
      showToast(handleApiError(e), "error");
    } finally {
      setLoading(false);
    }
  }, [search, type, category, method, startDate, endDate, showToast]);

  useEffect(() => {
    fetchTransactions(pag.page);
  }, [fetchTransactions, pag.page]);

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get("/categories");
        setCustomCats(res.data.categories.map((c) => c.name));
      } catch (e) {}
    })();
  }, []);

  const exportData = async (format) => {
    try {
      const params = { format };
      if (type) params.type = type;
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      const res = await api.get("/export/transactions", { params, responseType: "blob" });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement("a");
      a.href = url;
      a.download = `transactions.${format === "csv" ? "csv" : "json"}`;
      a.click();
      showToast("Report downloaded");
    } catch (e) {
      showToast(handleApiError(e), "error");
    }
  };

  return (
    <ProtectedLayout>
      <div className="space-y-6">
        <div className="card">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
            <div className="relative flex-1">
              <FaSearch className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <input
                className="input pl-9"
                placeholder="Search transactions..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPag((p) => ({ ...p, page: 1 }));
                }}
              />
            </div>
            <select className="input lg:w-40" value={type} onChange={(e) => {
              setType(e.target.value);
              setPag((p) => ({ ...p, page: 1 }));
            }}>
              <option value="">All Types</option>
              <option value="expense">Expense</option>
              <option value="income">Income</option>
            </select>
            <select className="input lg:w-44" value={category} onChange={(e) => {
              setCategory(e.target.value);
              setPag((p) => ({ ...p, page: 1 }));
            }}>
              <option value="">All Categories</option>
              {categories.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            <select className="input lg:w-44" value={method} onChange={(e) => {
              setMethod(e.target.value);
              setPag((p) => ({ ...p, page: 1 }));
            }}>
              <option value="">All Methods</option>
              {PAYMENT_METHODS.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>
          <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex gap-3">
              <div>
                <label className="label">From</label>
                <input type="date" className="input" value={startDate} onChange={(e) => {
                  setStartDate(e.target.value);
                  setPag((p) => ({ ...p, page: 1 }));
                }} />
              </div>
              <div>
                <label className="label">To</label>
                <input type="date" className="input" value={endDate} onChange={(e) => {
                  setEndDate(e.target.value);
                  setPag((p) => ({ ...p, page: 1 }));
                }} />
              </div>
            </div>
            <div className="flex gap-2">
              <button className="btn-outline" onClick={() => exportData("csv")}>
                <FaDownload /> CSV
              </button>
            </div>
          </div>
        </div>

        <div className="card overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-4 py-3 font-semibold text-gray-600 dark:text-gray-300">Type</th>
                  <th className="px-4 py-3 font-semibold text-gray-600 dark:text-gray-300">Title</th>
                  <th className="px-4 py-3 font-semibold text-gray-600 dark:text-gray-300">Category</th>
                  <th className="px-4 py-3 font-semibold text-gray-600 dark:text-gray-300">Method</th>
                  <th className="px-4 py-3 font-semibold text-gray-600 dark:text-gray-300">Date</th>
                  <th className="px-4 py-3 text-right font-semibold text-gray-600 dark:text-gray-300">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {transactions.map((t) => (
                  <tr key={t.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                          t.type === "expense"
                            ? "bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                            : "bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                        }`}
                      >
                        {t.type === "expense" ? "Expense" : "Income"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{CATEGORY_ICONS[t.category] || "📁"}</span>
                        <span className="font-medium text-gray-900 dark:text-gray-100">{t.title}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-500">{t.category}</td>
                    <td className="px-4 py-3 text-gray-500">{t.paymentMethod}</td>
                    <td className="px-4 py-3 text-gray-500">{formatDate(t.date)}</td>
                    <td
                      className={`px-4 py-3 text-right font-semibold ${
                        t.type === "expense"
                          ? "text-red-600 dark:text-red-400"
                          : "text-green-600 dark:text-green-400"
                      }`}
                    >
                      {t.type === "expense" ? "-" : "+"}
                      {formatMoney(t.amount, user?.currency)}
                    </td>
                  </tr>
                ))}
                {transactions.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center text-gray-500">
                      No transactions found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {pag.totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-gray-100 px-4 py-3 dark:border-gray-800">
              <p className="text-sm text-gray-500">{pag.total} transactions</p>
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
      </div>
    </ProtectedLayout>
  );
}
