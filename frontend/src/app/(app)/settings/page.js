"use client";

import { useState } from "react";
import ProtectedLayout from "@/components/ProtectedLayout";
import { useToast } from "@/components/Toast";
import { api, handleApiError } from "@/lib/api";
import { CURRENCIES } from "@/lib/constants";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/components/ThemeProvider";
import { FaSave, FaDownload } from "react-icons/fa";

export default function SettingsPage() {
  const { user, updateUser } = useAuth();
  const { applyTheme } = useTheme();
  const { showToast } = useToast();

  const [profile, setProfile] = useState({
    name: user?.name || "",
    email: user?.email || "",
    currency: user?.currency || "INR",
    monthlyBudget: user?.monthlyBudget || 0,
    notificationsEnabled: user?.notificationsEnabled !== undefined ? user.notificationsEnabled : true,
    theme: user?.theme || "light",
  });

  const [pwd, setPwd] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [saving, setSaving] = useState(false);

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await api.put("/auth/profile", profile);
      updateUser(res.data.user);
      applyTheme(profile.theme);
      showToast("Profile updated");
    } catch (err) {
      showToast(handleApiError(err), "error");
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (pwd.newPassword !== pwd.confirmPassword) {
      showToast("Passwords do not match", "error");
      return;
    }
    try {
      await api.put("/auth/change-password", {
        currentPassword: pwd.currentPassword,
        newPassword: pwd.newPassword,
      });
      showToast("Password changed");
      setPwd({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (err) {
      showToast(handleApiError(err), "error");
    }
  };

  const exportReport = async (year, format) => {
    try {
      const res = await api.get("/export/report", {
        params: { year, format },
        responseType: "blob",
      });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement("a");
      a.href = url;
      a.download = `report_${year}.${format === "json" ? "json" : "csv"}`;
      a.click();
      showToast("Report downloaded");
    } catch (e) {
      showToast(handleApiError(e), "error");
    }
  };

  const currentYear = new Date().getFullYear();

  return (
    <ProtectedLayout>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="card">
          <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-gray-100">
            Profile Settings
          </h2>
          <form onSubmit={handleProfileSubmit} className="space-y-4">
            <div>
              <label className="label">Name</label>
              <input
                className="input"
                value={profile.name}
                onChange={(e) => setProfile({ ...profile, name: e.target.value })}
              />
            </div>
            <div>
              <label className="label">Email</label>
              <input
                type="email"
                className="input"
                value={profile.email}
                onChange={(e) => setProfile({ ...profile, email: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Currency</label>
                <select
                  className="input"
                  value={profile.currency}
                  onChange={(e) => setProfile({ ...profile, currency: e.target.value })}
                >
                  {CURRENCIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Monthly Budget</label>
                <input
                  type="number"
                  className="input"
                  value={profile.monthlyBudget}
                  onChange={(e) => setProfile({ ...profile, monthlyBudget: Number(e.target.value) })}
                  min="0"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Theme</label>
                <select
                  className="input"
                  value={profile.theme}
                  onChange={(e) => setProfile({ ...profile, theme: e.target.value })}
                >
                  <option value="light">Light</option>
                  <option value="dark">Dark</option>
                </select>
              </div>
              <div>
                <label className="label">Notifications</label>
                <div className="mt-2.5 flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={profile.notificationsEnabled}
                    onChange={(e) =>
                      setProfile({ ...profile, notificationsEnabled: e.target.checked })
                    }
                    className="h-5 w-5 rounded accent-primary-600"
                  />
                  <span className="text-sm text-gray-600 dark:text-gray-400">Enabled</span>
                </div>
              </div>
            </div>
            <button type="submit" className="btn-primary" disabled={saving}>
              <FaSave /> {saving ? "Saving..." : "Save Profile"}
            </button>
          </form>
        </div>

        <div className="space-y-6">
          <div className="card">
            <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-gray-100">
              Change Password
            </h2>
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div>
                <label className="label">Current Password</label>
                <input
                  type="password"
                  className="input"
                  value={pwd.currentPassword}
                  onChange={(e) => setPwd({ ...pwd, currentPassword: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="label">New Password</label>
                <input
                  type="password"
                  className="input"
                  value={pwd.newPassword}
                  onChange={(e) => setPwd({ ...pwd, newPassword: e.target.value })}
                  required
                  minLength={6}
                />
              </div>
              <div>
                <label className="label">Confirm New Password</label>
                <input
                  type="password"
                  className="input"
                  value={pwd.confirmPassword}
                  onChange={(e) => setPwd({ ...pwd, confirmPassword: e.target.value })}
                  required
                />
              </div>
              <button type="submit" className="btn-primary">
                Change Password
              </button>
            </form>
          </div>

          <div className="card">
            <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-gray-100">
              Export Report
            </h2>
            <p className="mb-4 text-sm text-gray-500">
              Download your financial summary for a selected year.
            </p>
            <div className="flex flex-wrap gap-2">
              {[currentYear, currentYear - 1].map((y) => (
                <button key={y} className="btn-outline" onClick={() => exportReport(y, "csv")}>
                  <FaDownload /> {y} CSV
                </button>
              ))}
              <button className="btn-outline" onClick={() => exportReport(currentYear, "json")}>
                <FaDownload /> {currentYear} JSON
              </button>
            </div>
          </div>
        </div>
      </div>
    </ProtectedLayout>
  );
}
