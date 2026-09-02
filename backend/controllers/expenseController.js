const Expense = require("../models/Expense");

const expenseController = {
  async getExpenses(req, res) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 50;
      const skip = (page - 1) * limit;

      const filter = { user: req.user._id };

      if (req.query.search) {
        filter.$or = [
          { title: { $regex: req.query.search, $options: "i" } },
          { description: { $regex: req.query.search, $options: "i" } },
          { notes: { $regex: req.query.search, $options: "i" } },
        ];
      }

      if (req.query.category) {
        filter.category = req.query.category;
      }

      if (req.query.paymentMethod) {
        filter.paymentMethod = req.query.paymentMethod;
      }

      if (req.query.startDate && req.query.endDate) {
        filter.date = {
          $gte: new Date(req.query.startDate),
          $lte: new Date(req.query.endDate),
        };
      } else if (req.query.month) {
        const [year, month] = req.query.month.split("-").map(Number);
        const start = new Date(year, month - 1, 1);
        const end = new Date(year, month, 0, 23, 59, 59, 999);
        filter.date = { $gte: start, $lte: end };
      }

      const sortField = req.query.sortBy || "date";
      const sortOrder = req.query.sortOrder === "asc" ? 1 : -1;

      const total = await Expense.countDocuments(filter);
      const expenses = await Expense.find(filter)
        .sort({ [sortField]: sortOrder })
        .skip(skip)
        .limit(limit);

      res.json({
        success: true,
        expenses,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  async getExpense(req, res) {
    try {
      const expense = await Expense.findOne({
        _id: req.params.id,
        user: req.user._id,
      });
      if (!expense) {
        return res.status(404).json({ message: "Expense not found" });
      }
      res.json({ success: true, expense });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  async createExpense(req, res) {
    try {
      const { title, amount, category, date, paymentMethod, description, notes } =
        req.body;

      if (!title || !amount || !category) {
        return res.status(400).json({ message: "Please provide title, amount and category" });
      }

      const expense = await Expense.create({
        user: req.user._id,
        title,
        amount,
        category,
        date: date || Date.now(),
        paymentMethod: paymentMethod || "Cash",
        description: description || "",
        notes: notes || "",
      });

      res.status(201).json({ success: true, expense });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  async updateExpense(req, res) {
    try {
      let expense = await Expense.findOne({
        _id: req.params.id,
        user: req.user._id,
      });

      if (!expense) {
        return res.status(404).json({ message: "Expense not found" });
      }

      expense = await Expense.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true, runValidators: true }
      );

      res.json({ success: true, expense });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  async deleteExpense(req, res) {
    try {
      const expense = await Expense.findOneAndDelete({
        _id: req.params.id,
        user: req.user._id,
      });

      if (!expense) {
        return res.status(404).json({ message: "Expense not found" });
      }

      res.json({ success: true, message: "Expense deleted" });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },
};

module.exports = expenseController;
