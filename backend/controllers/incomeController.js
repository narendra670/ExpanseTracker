const Income = require("../models/Income");

const incomeController = {
  async getIncomes(req, res) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 50;
      const skip = (page - 1) * limit;

      const filter = { user: req.user._id };

      if (req.query.search) {
        filter.$or = [
          { source: { $regex: req.query.search, $options: "i" } },
          { description: { $regex: req.query.search, $options: "i" } },
        ];
      }

      if (req.query.category) {
        filter.category = req.query.category;
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

      const total = await Income.countDocuments(filter);
      const incomes = await Income.find(filter)
        .sort({ [sortField]: sortOrder })
        .skip(skip)
        .limit(limit);

      res.json({
        success: true,
        incomes,
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

  async getIncome(req, res) {
    try {
      const income = await Income.findOne({
        _id: req.params.id,
        user: req.user._id,
      });
      if (!income) {
        return res.status(404).json({ message: "Income not found" });
      }
      res.json({ success: true, income });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  async createIncome(req, res) {
    try {
      const { source, amount, category, date, description } = req.body;

      if (!source || !amount || !category) {
        return res.status(400).json({ message: "Please provide source, amount and category" });
      }

      const income = await Income.create({
        user: req.user._id,
        source,
        amount,
        category,
        date: date || Date.now(),
        description: description || "",
      });

      res.status(201).json({ success: true, income });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  async updateIncome(req, res) {
    try {
      let income = await Income.findOne({
        _id: req.params.id,
        user: req.user._id,
      });

      if (!income) {
        return res.status(404).json({ message: "Income not found" });
      }

      income = await Income.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true, runValidators: true }
      );

      res.json({ success: true, income });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  async deleteIncome(req, res) {
    try {
      const income = await Income.findOneAndDelete({
        _id: req.params.id,
        user: req.user._id,
      });

      if (!income) {
        return res.status(404).json({ message: "Income not found" });
      }

      res.json({ success: true, message: "Income deleted" });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },
};

module.exports = incomeController;
