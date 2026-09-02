"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import { FaBars } from "react-icons/fa";

const titles = {
  "/dashboard": "Dashboard",
  "/expenses": "Expenses",
  "/income": "Income",
  "/transactions": "Transactions",
  "/analytics": "Analytics",
  "/budgets": "Budgets",
  "/recurring": "Recurring Expenses",
  "/goals": "Financial Goals",
  "/categories": "Categories",
  "/settings": "Settings",
};

export default function AppLayout({ children }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const title = titles[pathname] || "Expense Tracker";

  return (
    <div className="min-h-screen">
      <Sidebar open={open} onClose={() => setOpen(false)} />
      <div className="lg:pl-72">
        <header className="sticky top-0 z-30 border-b border-gray-200 bg-white/80 backdrop-blur dark:border-gray-800 dark:bg-gray-950/80">
          <div className="flex items-center gap-4 px-4 py-4 sm:px-6">
            <button
              onClick={() => setOpen(true)}
              className="rounded-lg p-2 text-gray-600 hover:bg-gray-100 lg:hidden dark:text-gray-300 dark:hover:bg-gray-800"
            >
              <FaBars />
            </button>
            <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">
              {title}
            </h1>
          </div>
        </header>
        <main className="px-4 py-6 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
