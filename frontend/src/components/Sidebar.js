"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import {
  FaHome,
  FaArrowUp,
  FaArrowDown,
  FaExchangeAlt,
  FaChartPie,
  FaWallet,
  FaSyncAlt,
  FaBullseye,
  FaTags,
  FaCog,
  FaSignOutAlt,
} from "react-icons/fa";

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: FaHome },
  { name: "Expenses", href: "/expenses", icon: FaArrowDown },
  { name: "Income", href: "/income", icon: FaArrowUp },
  { name: "Transactions", href: "/transactions", icon: FaExchangeAlt },
  { name: "Analytics", href: "/analytics", icon: FaChartPie },
  { name: "Budgets", href: "/budgets", icon: FaWallet },
  { name: "Recurring", href: "/recurring", icon: FaSyncAlt },
  { name: "Goals", href: "/goals", icon: FaBullseye },
  { name: "Categories", href: "/categories", icon: FaTags },
  { name: "Settings", href: "/settings", icon: FaCog },
];

export default function Sidebar({ open, onClose }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={onClose}
        />
      )}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-col bg-white shadow-lg transition-transform dark:bg-gray-900 lg:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-full flex-col">
          <div className="flex items-center gap-3 border-b border-gray-200 px-6 py-5 dark:border-gray-800">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-600 text-xl text-white">
              💰
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                Expense Tracker
              </h1>
              <p className="text-xs text-gray-500">Personal Finance Manager</p>
            </div>
          </div>

          <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
            {navigation.map((item) => {
              const active =
                pathname === item.href || pathname.startsWith(item.href + "/");
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={onClose}
                  className={`flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium transition ${
                    active
                      ? "bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300"
                      : "text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
                  }`}
                >
                  <item.icon className="h-4 w-4" />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          <div className="border-t border-gray-200 p-4 dark:border-gray-800">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-100 text-primary-700 dark:bg-primary-900/40 dark:text-primary-300">
                {user?.name?.charAt(0)?.toUpperCase() || "U"}
              </div>
              <div className="flex-1 min-w-0">
                <p className="truncate text-sm font-semibold text-gray-900 dark:text-gray-100">
                  {user?.name}
                </p>
                <p className="truncate text-xs text-gray-500">{user?.email}</p>
              </div>
              <button
                onClick={logout}
                className="rounded-lg p-2 text-gray-400 transition hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/30"
                title="Logout"
              >
                <FaSignOutAlt />
              </button>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
