const express = require("express");
const router = express.Router();
const expenseController = require("../controllers/expenseController");
const { protect } = require("../middleware/auth");

router.use(protect);

router.get("/", expenseController.getExpenses);
router.post("/", expenseController.createExpense);
router.get("/:id", expenseController.getExpense);
router.put("/:id", expenseController.updateExpense);
router.delete("/:id", expenseController.deleteExpense);

module.exports = router;
