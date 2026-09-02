const express = require("express");
const router = express.Router();
const incomeController = require("../controllers/incomeController");
const { protect } = require("../middleware/auth");

router.use(protect);

router.get("/", incomeController.getIncomes);
router.post("/", incomeController.createIncome);
router.get("/:id", incomeController.getIncome);
router.put("/:id", incomeController.updateIncome);
router.delete("/:id", incomeController.deleteIncome);

module.exports = router;
