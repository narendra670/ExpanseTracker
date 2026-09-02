const RecurringExpense = require("../models/RecurringExpense");
const Expense = require("../models/Expense");

const calculateNextPayment = (recurring) => {
  let next = new Date(recurring.nextPaymentDate || recurring.startDate);
  const increment = {
    Daily: () => next.setDate(next.getDate() + 1),
    Weekly: () => next.setDate(next.getDate() + 7),
    Monthly: () => next.setMonth(next.getMonth() + 1),
    Yearly: () => next.setFullYear(next.getFullYear() + 1),
  };
  increment[recurring.frequency]();
  return new Date(next);
};

const recurringController = {
  async getRecurringExpenses(req, res) {
    try {
      const recurringExpenses = await RecurringExpense.find({
        user: req.user._id,
      }).sort({ nextPaymentDate: 1 });
      res.json({ success: true, recurringExpenses });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  async createRecurringExpense(req, res) {
    try {
      const {
        title,
        amount,
        category,
        frequency,
        startDate,
        endDate,
        active,
        paymentMethod,
        description,
      } = req.body;

      if (!title || !amount || !category || !frequency || !startDate) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      const start = new Date(startDate);
      const recurringExpense = await RecurringExpense.create({
        user: req.user._id,
        title,
        amount,
        category,
        frequency,
        startDate: start,
        endDate: endDate ? new Date(endDate) : undefined,
        active: active !== undefined ? active : true,
        paymentMethod,
        description,
        nextPaymentDate: start,
        lastProcessedDate: null,
      });

      res.status(201).json({ success: true, recurringExpense });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  async updateRecurringExpense(req, res) {
    try {
      let recurring = await RecurringExpense.findOne({
        _id: req.params.id,
        user: req.user._id,
      });
      if (!recurring) {
        return res.status(404).json({ message: "Recurring expense not found" });
      }

      recurring = await RecurringExpense.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true,
      });
      res.json({ success: true, recurringExpense: recurring });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  async deleteRecurringExpense(req, res) {
    try {
      const recurring = await RecurringExpense.findOneAndDelete({
        _id: req.params.id,
        user: req.user._id,
      });
      if (!recurring) {
        return res.status(404).json({ message: "Recurring expense not found" });
      }
      res.json({ success: true, message: "Recurring expense deleted" });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  async processDueExpenses(req, res) {
    try {
      const now = new Date();
      const due = await RecurringExpense.find({
        user: req.user._id,
        active: true,
        nextPaymentDate: { $lte: now },
      });

      const created = [];
      for (const rec of due) {
        if (rec.endDate && now > new Date(rec.endDate)) {
          rec.active = false;
          await rec.save();
          continue;
        }

        if (rec.lastProcessedDate && rec.nextPaymentDate <= new Date(rec.lastProcessedDate)) {
          rec.nextPaymentDate = calculateNextPayment(rec);
          await rec.save();
          continue;
        }

        const expense = await Expense.create({
          user: rec.user,
          title: rec.title,
          amount: rec.amount,
          category: rec.category,
          date: new Date(),
          paymentMethod: rec.paymentMethod,
          description: rec.description || "Recurring payment",
        });
        created.push(expense);

        rec.lastProcessedDate = new Date();
        rec.nextPaymentDate = calculateNextPayment(rec);
        await rec.save();
      }

      res.json({ success: true, processed: created.length, created });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },
};

module.exports = recurringController;
