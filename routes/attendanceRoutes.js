const express = require("express");
const router = express.Router();
const { verifyToken } = require("../middleware/authMiddleware");
const attendanceController = require("../controllers/attendanceController");

router.get("/", verifyToken, attendanceController.getUserAttendance);
router.post("/check-in", verifyToken, attendanceController.checkIn);
router.post("/check-out", verifyToken, attendanceController.checkOut);

module.exports = router;