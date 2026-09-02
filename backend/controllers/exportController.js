const Expense = require("../models/Expense");
const Income = require("../models/Income");
const { Parser } = require("json2csv");

const exportController = {
  async exportTransactions(req, res) {
    try {
      const { format, type, startDate, endDate } = req.query;

      const filter = { user: req.user._id };
      if (startDate && endDate) {
        filter.date = { $gte: new Date(startDate), $lte: new Date(endDate) };
      }

      let expenses = [];
      let incomes = [];

      if (!type || type === "expense") {
        expenses = await Expense.find(filter);
      }
      if (!type || type === "income") {
        incomes = await Income.find(filter);
      }

      const rows = [
        ...expenses.map((e) => ({
          Date: new Date(e.date).toLocaleDateString("en-IN"),
          Type: "Expense",
          Title: e.title,
          Category: e.category,
          Amount: e.amount,
          PaymentMethod: e.paymentMethod,
          Description: e.description,
        })),
        ...incomes.map((i) => ({
          Date: new Date(i.date).toLocaleDateString("en-IN"),
          Type: "Income",
          Title: i.source,
          Category: i.category,
          Amount: i.amount,
          PaymentMethod: "N/A",
          Description: i.description,
        })),
      ].sort((a, b) => new Date(a.Date) - new Date(b.Date));

      const filename = `transactions_${Date.now()}`;

      if (format === "csv") {
        const parser = new Parser({ fields: ["Date", "Type", "Title", "Category", "Amount", "PaymentMethod", "Description"] });
        const csv = parser.parse(rows);
        res.setHeader("Content-Type", "text/csv");
        res.setHeader("Content-Disposition", `attachment; filename=${filename}.csv`);
        return res.send(csv);
      }

      if (format === "json") {
        res.setHeader("Content-Type", "application/json");
        res.setHeader("Content-Disposition", `attachment; filename=${filename}.json`);
        return res.send(JSON.stringify(rows, null, 2));
      }

      const parser = new Parser({ fields: ["Date", "Type", "Title", "Category", "Amount", "PaymentMethod", "Description"] });
      const csv = parser.parse(rows);
      res.setHeader("Content-Type", "text/csv");
      res.setHeader("Content-Disposition", `attachment; filename=${filename}.csv`);
      res.send(csv);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  async exportReport(req, res) {
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

      const totalIncome = incomes.reduce((s, i) => s + i.amount, 0);
      const totalExpense = expenses.reduce((s, e) => s + e.amount, 0);
      const totalSavings = totalIncome - totalExpense;

      const categoryBreakdown = {};
      expenses.forEach((e) => {
        categoryBreakdown[e.category] = (categoryBreakdown[e.category] || 0) + e.amount;
      });

      const report = {
        year,
        totalIncome,
        totalExpense,
        totalSavings,
        categories: categoryBreakdown,
        generatedAt: new Date(),
        user: req.user.name,
      };

      if (req.query.format === "json") {
        res.setHeader("Content-Type", "application/json");
        res.setHeader("Content-Disposition", `attachment; filename=report_${year}.json`);
        return res.send(JSON.stringify(report, null, 2));
      }

      const summaryRows = [
        { Field: "Year", Value: year },
        { Field: "Total Income", Value: totalIncome },
        { Field: "Total Expense", Value: totalExpense },
        { Field: "Total Savings", Value: totalSavings },
        { Field: "Savings Rate", Value: `${totalIncome > 0 ? Math.round((totalSavings / totalIncome) * 100) : 0}%` },
      ];

      const catRows = Object.entries(categoryBreakdown).map(([name, value]) => ({
        Category: name,
        Amount: Math.round(value),
      }));

      const summaryParser = new Parser({ fields: ["Field", "Value"] });
      const catParser = new Parser({ fields: ["Category", "Amount"] });

      const csv =
        `Expense Report for ${year}\nUser: ${req.user.name}\n\n` +
        `SUMMARY\n` +
        summaryParser.parse(summaryRows) +
        `\n\nCATEGORY BREAKDOWN\n` +
        catParser.parse(catRows);

      res.setHeader("Content-Type", "text/csv");
      res.setHeader("Content-Disposition", `attachment; filename=report_${year}.csv`);
      res.send(csv);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },
};

module.exports = exportController;
