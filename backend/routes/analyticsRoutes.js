const express = require("express");
const router = express.Router();
const analyticsController = require("../controllers/analyticsController");
const { protect } = require("../middleware/auth");

router.use(protect);

router.get("/dashboard", analyticsController.getDashboard);
router.get("/analytics", analyticsController.getAnalytics);
router.get("/alerts", analyticsController.getAlerts);

module.exports = router;
