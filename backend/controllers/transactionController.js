const Expense = require("../models/Expense");
const Income = require("../models/Income");

const transactionController = {
  async getTransactions(req, res) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 20;
      const skip = (page - 1) * limit;

      const filter = { user: req.user._id };

      if (req.query.startDate && req.query.endDate) {
        filter.date = {
          $gte: new Date(req.query.startDate),
          $lte: new Date(req.query.endDate),
        };
      }

      const type = req.query.type;
      const search = req.query.search;
      const category = req.query.category;
      const paymentMethod = req.query.paymentMethod;

      let expenses = [];
      let incomes = [];

      if (!type || type === "expense") {
        const eFilter = { ...filter };
        if (category) eFilter.category = category;
        if (paymentMethod) eFilter.paymentMethod = paymentMethod;
        if (search) {
          eFilter.$or = [
            { title: { $regex: search, $options: "i" } },
            { description: { $regex: search, $options: "i" } },
          ];
        }
        expenses = await Expense.find(eFilter);
      }

      if (!type || type === "income") {
        const iFilter = { ...filter };
        if (category) iFilter.category = category;
        if (search) {
          iFilter.$or = [
            { source: { $regex: search, $options: "i" } },
            { description: { $regex: search, $options: "i" } },
          ];
        }
        incomes = await Income.find(iFilter);
      }

      let transactions = [
        ...expenses.map((e) => ({
          id: e._id,
          type: "expense",
          category: e.category,
          amount: e.amount,
          title: e.title,
          description: e.description,
          paymentMethod: e.paymentMethod,
          date: e.date,
          createdAt: e.createdAt,
        })),
        ...incomes.map((i) => ({
          id: i._id,
          type: "income",
          category: i.category,
          amount: i.amount,
          title: i.source,
          description: i.description,
          paymentMethod: "N/A",
          date: i.date,
          createdAt: i.createdAt,
        })),
      ];

      transactions.sort((a, b) => new Date(b.date) - new Date(a.date));

      const total = transactions.length;
      transactions = transactions.slice(skip, skip + limit);

      res.json({
        success: true,
        transactions,
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
};

module.exports = transactionController;
