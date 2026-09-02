const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const { protect } = require("../middleware/auth");
const upload = require("../middleware/upload");

router.post("/register", authController.register);
router.post("/login", authController.login);
router.get("/profile", protect, authController.getUserProfile);
router.put("/profile", protect, upload.single("profilePicture"), authController.updateProfile);
router.put("/change-password", protect, authController.changePassword);

module.exports = router;
