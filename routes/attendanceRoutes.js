const express = require("express");
const router = express.Router();
const { verifyToken } = require("../middleware/authMiddleware");
const attendanceController = require("../controllers/attendanceController");

// Get server time
router.get("/server-time", (req, res) => {
  const now = new Date();
  res.json({
    time: now.toTimeString().split(" ")[0],
    date: now.toISOString().split("T")[0]
  });
});

// Get user attendance
router.get("/", verifyToken, attendanceController.getUserAttendance);

// Get all attendance (admin only)
router.get("/all", verifyToken, attendanceController.getAllAttendance);

router.post("/check-in", verifyToken, attendanceController.checkIn);
router.post("/check-out", verifyToken, attendanceController.checkOut);

module.exports = router;