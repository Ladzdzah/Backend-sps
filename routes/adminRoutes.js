const express = require("express");
const router = express.Router();
const { verifyToken, isAdmin } = require("../middleware/authMiddleware");
const userController = require("../controllers/userController");
const officeLocationController = require("../controllers/officeLocationController");
const attendanceScheduleController = require("../controllers/attendanceScheduleController");
const attendanceController = require("../controllers/attendanceController");

// Move verify endpoint to the top and fix the route
router.post("/verify", verifyToken, isAdmin, userController.verifyAdminPassword);

// User management routes
router.get("/users", verifyToken, isAdmin, userController.getAllUsers);
router.post("/users", verifyToken, isAdmin, userController.createUser);
router.delete("/users/:id", verifyToken, isAdmin, userController.deleteUser);

// Office location routes
router.get("/office-location", verifyToken, officeLocationController.getOfficeLocation);
router.put("/office-location", verifyToken, isAdmin, officeLocationController.updateOfficeLocation);

// Attendance schedule routes
router.get("/attendance-schedule", verifyToken, attendanceScheduleController.getAttendanceSchedule);
router.put("/attendance-schedule", verifyToken, isAdmin, attendanceScheduleController.updateAttendanceSchedule);

// Attendance management routes
router.get("/attendance", verifyToken, isAdmin, attendanceController.getAllAttendance);
router.get("/attendance/:userId", verifyToken, isAdmin, attendanceController.getUserAttendance);
router.post("/attendance/check-in", verifyToken, attendanceController.checkIn);
router.post("/attendance/check-out", verifyToken, attendanceController.checkOut);
router.get("/attendance/daily", verifyToken, isAdmin, attendanceController.getDailyAttendance);

module.exports = router;
