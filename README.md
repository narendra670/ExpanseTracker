# 💰 Expense Tracker — MERN/Full Stack Edition

A complete personal-finance management system built with **Next.js**, **Node.js/Express**, **MongoDB**, and **Tailwind CSS**.

## ✨ Features

- **Authentication** — Register / Login / Logout, JWT + bcrypt, protected routes, change password, profile management
- **Dashboard** — Total balance, income, expenses, savings, monthly overview chart, recent transactions, savings trend
- **Expense Management** — Full CRUD with search, filter by category/payment method, sort, pagination
- **Income Management** — Full CRUD with categories and search
- **Transaction History** — Combined income/expense view with search, filters, date range, pagination, and CSV/JSON export
- **Analytics** — Monthly income/expense charts, category-wise pie chart, daily spending, savings trend, smart insights
- **Budget Management** — Per-category monthly budgets with progress bars, remaining budget, warnings
- **Expense Alerts** — Budget 80%/exceeded warnings, recurring payment due reminders, spending increase detection
- **Recurring Expenses** — Automatic recurring payments (daily/weekly/monthly/yearly)
- **Financial Goals** — Set targets, track progress, add money directly
- **Custom Categories** — Create your own categories with icons and colors
- **Export Reports** — Download CSV/JSON reports of transactions and yearly summaries
- **Dark/Light Mode** — Fully themed, responsive across desktop/tablet/mobile

## 🛠 Tech Stack

| Layer      | Technology                          |
|------------|-------------------------------------|
| Frontend   | Next.js 14 (App Router), React 18   |
| Styling    | Tailwind CSS                        |
| Backend    | Node.js, Express                    |
| Database   | MongoDB, Mongoose                   |
| Auth       | JWT, bcryptjs                       |
| Charts     | Recharts                            |
| Icons      | React Icons                         |
| HTTP       | Axios                               |

## 📁 Project Structure

```
Expense Tracker/
├── backend/                 # Express REST API
│   ├── config/              # DB connection
│   ├── controllers/         # Business logic
│   ├── middleware/          # Auth + upload
│   ├── models/              # Mongoose schemas
│   ├── routes/              # API routes
│   ├── utils/               # Helpers
│   └── server.js
└── frontend/                # Next.js app
    └── src/
        ├── app/             # Pages (App Router)
        ├── components/      # Reusable UI
        ├── context/         # Auth context
        └── lib/             # API client + constants
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- MongoDB (local or Atlas)

### 1. Backend

```bash
cd backend
npm install
cp .env .env.local   # (optional) edit values
npm run dev          # starts on http://localhost:5000
```

> The `.env` ships with `MONGODB_URI=mongodb://localhost:27017/expense-tracker`. Point it to your Atlas URI if needed.

### 2. Frontend

```bash
cd frontend
npm install
npm run dev          # starts on http://localhost:3000
```

Open **http://localhost:3000**, register a new account, and start tracking.

## 🔌 API Overview

| Method & Route             | Description                    |
|----------------------------|--------------------------------|
| `POST /api/auth/register`  | Register a new user            |
| `POST /api/auth/login`     | Login                          |
| `GET/PUT /api/auth/profile`| Get / update profile           |
| `GET/POST /api/expenses`   | List / create expenses         |
| `PUT/DELETE /api/expenses/:id` | Update / delete expense     |
| `GET/POST /api/incomes`    | List / create income           |
| `GET/POST /api/budgets`    | List / create budgets          |
| `GET/POST /api/goals`      | List / create goals            |
| `GET/POST /api/recurring`  | List / create recurring        |
| `GET/POST /api/categories` | List / create categories       |
| `GET /api/transactions`    | Combined transaction history   |
| `GET /api/dashboard`       | Dashboard summary              |
| `GET /api/analytics`       | Chart data + insights          |
| `GET /api/alerts`          | Budget / recurring alerts      |
| `GET /api/export/*`        | CSV / JSON exports             |

All protected routes require `Authorization: Bearer <token>`.

## 📝 Environment Variables

**Backend (`backend/.env`):**
- `PORT` — API port (default `5000`)
- `MONGODB_URI` — MongoDB connection string
- `JWT_SECRET` — Secret for signing tokens
- `JWT_EXPIRE` — Token expiry (default `7d`)

**Frontend (`frontend/.env.local`):**
- `NEXT_PUBLIC_API_URL` — Backend API base URL (default `http://localhost:5000/api`)
