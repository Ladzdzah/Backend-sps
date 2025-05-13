const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const { verifyToken, isAdmin } = require("../middleware/authMiddleware"); // Add isAdmin import

router.post("/register", authController.register);
router.post("/login", authController.loginUser);
router.post("/reset-password", verifyToken, authController.resetPassword);

module.exports = router;
