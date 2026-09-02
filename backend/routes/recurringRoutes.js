const express = require("express");
const router = express.Router();
const recurringController = require("../controllers/recurringController");
const { protect } = require("../middleware/auth");

router.use(protect);

router.get("/", recurringController.getRecurringExpenses);
router.post("/", recurringController.createRecurringExpense);
router.post("/process", recurringController.processDueExpenses);
router.put("/:id", recurringController.updateRecurringExpense);
router.delete("/:id", recurringController.deleteRecurringExpense);

module.exports = router;
