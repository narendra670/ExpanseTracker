"use client";

import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { api, setAuthToken, getToken } from "@/lib/api";
import { handleApiError } from "@/lib/api";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const storedToken = getToken();
    if (storedToken) {
      setToken(storedToken);
      setAuthToken(storedToken);
      fetchProfile(storedToken);
    } else {
      setLoading(false);
    }
  }, []);

  const fetchProfile = async (tok) => {
    try {
      if (!tok) tok = token || getToken();
      const res = await api.get("/auth/profile", {
        headers: { Authorization: `Bearer ${tok}` },
      });
      setUser(res.data.user);
    } catch (error) {
      logout();
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      const res = await api.post("/auth/login", { email, password });
      const { token: newToken, user: userData } = res.data;
      localStorage.setItem("token", newToken);
      setAuthToken(newToken);
      setToken(newToken);
      setUser(userData);
      return { success: true };
    } catch (error) {
      return { success: false, message: handleApiError(error) };
    }
  };

  const register = async (name, email, password) => {
    try {
      const res = await api.post("/auth/register", { name, email, password });
      const { token: newToken, user: userData } = res.data;
      localStorage.setItem("token", newToken);
      setAuthToken(newToken);
      setToken(newToken);
      setUser(userData);
      return { success: true };
    } catch (error) {
      return { success: false, message: handleApiError(error) };
    }
  };

  const logout = useCallback(() => {
    localStorage.removeItem("token");
    setAuthToken(null);
    setToken(null);
    setUser(null);
    router.push("/login");
  }, [router]);

  const updateUser = (data) => {
    setUser((prev) => ({ ...prev, ...data }));
  };

  const value = {
    user,
    token,
    loading,
    login,
    register,
    logout,
    updateUser,
    fetchProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
