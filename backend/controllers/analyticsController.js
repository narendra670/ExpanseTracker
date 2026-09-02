const Expense = require("../models/Expense");
const Income = require("../models/Income");
const Budget = require("../models/Budget");

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

const analyticsController = {
  async getDashboard(req, res) {
    try {
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

      const [allExpenses, allIncomes, monthlyExpenses, monthlyIncomes, lastMonthExpenses] =
        await Promise.all([
          Expense.find({ user: req.user._id }),
          Income.find({ user: req.user._id }),
          Expense.find({ user: req.user._id, date: { $gte: startOfMonth, $lte: endOfMonth } }),
          Income.find({ user: req.user._id, date: { $gte: startOfMonth, $lte: endOfMonth } }),
          Expense.find({
            user: req.user._id,
            date: {
              $gte: new Date(now.getFullYear(), now.getMonth() - 1, 1),
              $lte: new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999),
            },
          }),
        ]);

      const totalIncome = allIncomes.reduce((s, i) => s + i.amount, 0);
      const totalExpense = allExpenses.reduce((s, e) => s + e.amount, 0);
      const monthlyIncome = monthlyIncomes.reduce((s, i) => s + i.amount, 0);
      const monthlyExpense = monthlyExpenses.reduce((s, e) => s + e.amount, 0);
      const lastMonthExpense = lastMonthExpenses.reduce((s, e) => s + e.amount, 0);

      const savings = totalIncome - totalExpense;
      const balance = totalIncome - totalExpense;

      const recentTransactions = [
        ...monthlyIncomes.map((i) => ({
          id: i._id,
          type: "income",
          title: i.source,
          amount: i.amount,
          category: i.category,
          date: i.date,
        })),
        ...monthlyExpenses.map((e) => ({
          id: e._id,
          type: "expense",
          title: e.title,
          amount: e.amount,
          category: e.category,
          date: e.date,
        })),
      ]
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(0, 8);

      const currIdx = now.getMonth();
      const prevIdx = (currIdx + 11) % 12;
      const expenseChange =
        lastMonthExpense > 0
          ? ((monthlyExpense - lastMonthExpense) / lastMonthExpense) * 100
          : 0;

      res.json({
        success: true,
        dashboard: {
          totalBalance: balance,
          totalIncome,
          totalExpense,
          totalSavings: savings,
          monthlyIncome,
          monthlyExpense,
          monthlySavings: monthlyIncome - monthlyExpense,
          expenseTrend: prevIdx > currIdx ? null : null,
          expenseChange: Math.round(expenseChange * 10) / 10,
          recentTransactions,
          month: MONTHS[currIdx],
        },
      });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  async getAnalytics(req, res) {
    try {
      const year = parseInt(req.query.year) || new Date().getFullYear();

      const expenses = await Expense.find({
        user: req.user._id,
        date: {
          $gte: new Date(year, 0, 1),
          $lte: new Date(year, 11, 31, 23, 59, 59, 999),
        },
      });
      const incomes = await Income.find({
        user: req.user._id,
        date: {
          $gte: new Date(year, 0, 1),
          $lte: new Date(year, 11, 31, 23, 59, 59, 999),
        },
      });

      const monthlyExpense = Array(12).fill(0);
      const monthlyIncome = Array(12).fill(0);
      expenses.forEach((e) => {
        monthlyExpense[e.date.getMonth()] += e.amount;
      });
      incomes.forEach((i) => {
        monthlyIncome[i.date.getMonth()] += i.amount;
      });

      const categoryExpenses = {};
      expenses.forEach((e) => {
        categoryExpenses[e.category] = (categoryExpenses[e.category] || 0) + e.amount;
      });

      const categoryDistribution = Object.entries(categoryExpenses)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value);

      const dailySpending = {};
      expenses
        .filter((e) => e.date.getFullYear() === year && e.date.getMonth() === new Date().getMonth())
        .forEach((e) => {
          const day = e.date.getDate();
          dailySpending[day] = (dailySpending[day] || 0) + e.amount;
        });

      const dailySpendingData = Object.entries(dailySpending)
        .map(([day, amount]) => ({ day: parseInt(day), amount }))
        .sort((a, b) => a.day - b.day);

      let totalIncome = 0;
      let totalExpense = 0;
      let cumulativeSavings = 0;
      const savingsTrend = Array(12).fill(0);
      for (let i = 0; i < 12; i++) {
        totalIncome += monthlyIncome[i];
        totalExpense += monthlyExpense[i];
        cumulativeSavings += monthlyIncome[i] - monthlyExpense[i];
        savingsTrend[i] = cumulativeSavings;
      }

      const insights = [];
      const currentMonthExp = monthlyExpense[new Date().getMonth()];
      const lastMonthExp = monthlyExpense[(new Date().getMonth() + 11) % 12];
      if (lastMonthExp > 0) {
        const change = ((currentMonthExp - lastMonthExp) / lastMonthExp) * 100;
        if (change > 10) {
          insights.push(`Your expenses increased by ${Math.round(change)}% compared to last month. Consider reviewing your spending habits.`);
        } else if (change < -10) {
          insights.push(`Great job! Your expenses decreased by ${Math.round(Math.abs(change))}% compared to last month.`);
        }
      }

      if (categoryDistribution.length > 0) {
        insights.push(`You spent the most on ${categoryDistribution[0].name} this year (${new Intl.NumberFormat("en-IN").format(Math.round(categoryDistribution[0].value))} ${req.user.currency}).`);
      }

      res.json({
        success: true,
        analytics: {
          year,
          monthlyExpense,
          monthlyIncome,
          categoryExpenses: categoryDistribution,
          dailySpending: dailySpendingData,
          savingsTrend,
          insights,
          totalIncome,
          totalExpense,
        },
      });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  async getAlerts(req, res) {
    try {
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
      const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

      const [budgets, expenses, recurringExpenses] = await Promise.all([
        Budget.find({ user: req.user._id, month }),
        Expense.find({ user: req.user._id, date: { $gte: startOfMonth, $lte: endOfMonth } }),
        require("../models/RecurringExpense").find({ user: req.user._id, active: true }),
      ]);

      const spentByCategory = {};
      expenses.forEach((e) => {
        spentByCategory[e.category] = (spentByCategory[e.category] || 0) + e.amount;
      });

      const alerts = [];

      budgets.forEach((b) => {
        const spent = spentByCategory[b.category] || 0;
        const pct = b.limit > 0 ? (spent / b.limit) * 100 : 0;
        if (pct >= 100) {
          alerts.push({
            type: "danger",
            message: `You have exceeded your ${b.category} budget. Spent ${new Intl.NumberFormat("en-IN").format(Math.round(spent))} ${req.user.currency} out of ${new Intl.NumberFormat("en-IN").format(Math.round(b.limit))} ${req.user.currency}.`,
            category: b.category,
          });
        } else if (pct >= 80) {
          alerts.push({
            type: "warning",
            message: `You have used ${Math.round(pct)}% of your ${b.category} budget. Only ${new Intl.NumberFormat("en-IN").format(Math.round(b.limit - spent))} ${req.user.currency} remaining.`,
            category: b.category,
          });
        }
      });

      recurringExpenses.forEach((r) => {
        const due = new Date(r.nextPaymentDate);
        const diffDays = Math.ceil((due - now) / (1000 * 60 * 60 * 24));
        if (diffDays <= 3) {
          alerts.push({
            type: "info",
            message: `Recurring payment "${r.title}" of ${new Intl.NumberFormat("en-IN").format(Math.round(r.amount))} ${req.user.currency} is due in ${Math.max(diffDays, 0)} days.`,
            category: r.category,
          });
        }
      });

      const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const prevMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
      const prevExpenses = await Expense.find({
        user: req.user._id,
        date: { $gte: prevMonthStart, $lte: prevMonthEnd },
      });
      const prevTotal = prevExpenses.reduce((s, e) => s + e.amount, 0);
      const currTotal = expenses.reduce((s, e) => s + e.amount, 0);

      if (prevTotal > 0 && currTotal > prevTotal * 1.3) {
        alerts.push({
          type: "danger",
          message: `Your monthly expenses increased by ${Math.round(((currTotal - prevTotal) / prevTotal) * 100)}% compared to last month.`,
          category: "All",
        });
      }

      res.json({ success: true, alerts });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },
};

module.exports = analyticsController;
