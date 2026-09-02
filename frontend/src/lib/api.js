import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:6001/api";

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

export const setAuthToken = (token) => {
  if (token) {
    api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common["Authorization"];
  }
};

export const getToken = () => {
  if (typeof window !== "undefined") {
    return localStorage.getItem("token");
  }
  return null;
};

if (typeof window !== "undefined") {
  const token = localStorage.getItem("token");
  if (token) {
    setAuthToken(token);
  }
}

export const formatMoney = (amount, currency = "INR") => {
  const symbols = {
    INR: "₹",
    USD: "$",
    EUR: "€",
    GBP: "£",
    JPY: "¥",
  };
  const symbol = symbols[currency] || "₹";
  if (currency === "INR") {
    return `${symbol}${Number(amount || 0).toLocaleString("en-IN")}`;
  }
  return `${symbol}${Number(amount || 0).toLocaleString("en-US")}`;
};

export const formatDate = (date) => {
  const d = new Date(date);
  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

export const formatDateShort = (date) => {
  const d = new Date(date);
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short" });
};

export const handleApiError = (error) => {
  if (error.response && error.response.data && error.response.data.message) {
    return error.response.data.message;
  }
  return "Something went wrong. Please try again.";
};
