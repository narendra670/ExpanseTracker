const express = require("express");
const mongoose = require("mongoose");

const path = require("path");
const fs = require("fs");
require("dotenv").config();

const connectDB = require("./config/db");
const authRoutes = require("./routes/authRoutes");
const expenseRoutes = require("./routes/expenseRoutes");
const incomeRoutes = require("./routes/incomeRoutes");
const budgetRoutes = require("./routes/budgetRoutes");
const recurringRoutes = require("./routes/recurringRoutes");
const goalRoutes = require("./routes/goalRoutes");
const categoryRoutes = require("./routes/categoryRoutes");
const transactionRoutes = require("./routes/transactionRoutes");
const analyticsRoutes = require("./routes/analyticsRoutes");
const exportRoutes = require("./routes/exportRoutes");

if (!fs.existsSync("uploads")) {
  fs.mkdirSync("uploads");
}

connectDB();

const app = express();

const allowedOrigins = process.env.CLIENT_URL
  ? process.env.CLIENT_URL.split(",")
  : ["http://localhost:3000", "http://localhost:3001", "http://localhost:5173"];

app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (!origin || allowedOrigins.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin || "*");
  }
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type,Authorization");
  if (req.method === "OPTIONS") {
    return res.sendStatus(204);
  }
  next();
});
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use((req, res, next) => {
  const start = Date.now();
  res.on("finish", () => {
    const duration = Date.now() - start;
    console.log(`${req.method} ${req.originalUrl} ${res.statusCode} ${duration}ms`);
  });
  next();
});

app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.get("/", (req, res) => {
  res.send("Expense Tracker API is running");
});

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.use("/api/auth", authRoutes);
app.use("/api/expenses", expenseRoutes);
app.use("/api/incomes", incomeRoutes);
app.use("/api/budgets", budgetRoutes);
app.use("/api/recurring", recurringRoutes);
app.use("/api/goals", goalRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/transactions", transactionRoutes);
app.use("/api", analyticsRoutes);
app.use("/api/export", exportRoutes);

app.use((req, res) => {
  res.status(404).json({ message: "API route not found" });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    message: err.message || "Server error",
  });
});

const PORT = process.env.PORT || 6001;

const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

setInterval(async () => {
  try {
    const RecurringExpense = require("./models/RecurringExpense");
    const Expense = require("./models/Expense");
    const now = new Date();
    const due = await RecurringExpense.find({
      active: true,
      nextPaymentDate: { $lte: now },
    });
    for (const rec of due) {
      if (rec.endDate && now > new Date(rec.endDate)) {
        rec.active = false;
        await rec.save();
        continue;
      }
      await Expense.create({
        user: rec.user,
        title: rec.title,
        amount: rec.amount,
        category: rec.category,
        date: new Date(),
        paymentMethod: rec.paymentMethod,
        description: rec.description || "Recurring payment",
      });
      rec.lastProcessedDate = new Date();
      const increment = {
        Daily: () => rec.nextPaymentDate.setDate(rec.nextPaymentDate.getDate() + 1),
        Weekly: () => rec.nextPaymentDate.setDate(rec.nextPaymentDate.getDate() + 7),
        Monthly: () => rec.nextPaymentDate.setMonth(rec.nextPaymentDate.getMonth() + 1),
        Yearly: () => rec.nextPaymentDate.setFullYear(rec.nextPaymentDate.getFullYear() + 1),
      };
      increment[rec.frequency]();
      rec.nextPaymentDate = new Date(rec.nextPaymentDate);
      await rec.save();
    }
  } catch (e) {
    console.error("Recurring job error:", e.message);
  }
}, 6 * 60 * 60 * 1000);

module.exports = server;
