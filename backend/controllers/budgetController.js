const Budget = require("../models/Budget");
const Expense = require("../models/Expense");

const getMonthRange = (month) => {
  const [year, m] = month.split("-").map(Number);
  const start = new Date(year, m - 1, 1);
  const end = new Date(year, m, 0, 23, 59, 59, 999);
  return { start, end };
};

const budgetController = {
  async getBudgets(req, res) {
    try {
      let month = req.query.month;
      if (!month) {
        const d = new Date();
        month = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      }

      const budgets = await Budget.find({ user: req.user._id, month });

      const { start, end } = getMonthRange(month);
      const expenses = await Expense.find({
        user: req.user._id,
        date: { $gte: start, $lte: end },
      });

      const spentByCategory = {};
      expenses.forEach((e) => {
        spentByCategory[e.category] = (spentByCategory[e.category] || 0) + e.amount;
      });

      const budgetsWithUsage = budgets.map((b) => {
        const spent = spentByCategory[b.category] || 0;
        const percentage = b.limit > 0 ? (spent / b.limit) * 100 : 0;
        return {
          ...b.toObject(),
          spent,
          remaining: b.limit - spent,
          percentage: Math.min(100, Math.round(percentage * 10) / 10),
          exceedsBudget: spent > b.limit,
          warning: percentage >= 80 && percentage < 100,
        };
      });

      res.json({ success: true, budgets: budgetsWithUsage });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  async createBudget(req, res) {
    try {
      const { category, limit, month, description } = req.body;
      if (!category || !limit) {
        return res.status(400).json({ message: "Please provide category and limit" });
      }

      const existing = await Budget.findOne({
        user: req.user._id,
        category,
        month: month || undefined,
      });

      if (existing) {
        return res.status(400).json({ message: "Budget already exists for this category and month" });
      }

      const budget = await Budget.create({
        user: req.user._id,
        category,
        limit,
        month,
        description,
      });

      res.status(201).json({ success: true, budget });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  async updateBudget(req, res) {
    try {
      let budget = await Budget.findOne({
        _id: req.params.id,
        user: req.user._id,
      });
      if (!budget) {
        return res.status(404).json({ message: "Budget not found" });
      }

      budget = await Budget.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true,
      });
      res.json({ success: true, budget });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  async deleteBudget(req, res) {
    try {
      const budget = await Budget.findOneAndDelete({
        _id: req.params.id,
        user: req.user._id,
      });
      if (!budget) {
        return res.status(404).json({ message: "Budget not found" });
      }
      res.json({ success: true, message: "Budget deleted" });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },
};

module.exports = budgetController;
