const express = require("express");
const router = express.Router();
const exportController = require("../controllers/exportController");
const { protect } = require("../middleware/auth");

router.use(protect);

router.get("/transactions", exportController.exportTransactions);
router.get("/report", exportController.exportReport);

module.exports = router;
