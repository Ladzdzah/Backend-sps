const AttendanceService = require('../services/attendanceService');
const AttendanceScheduleModel = require('../models/attendanceScheduleModel');
const OfficeLocationModel = require('../models/officeLocationModel');
const AttendanceModel = require('../models/attendanceModel');

const attendanceController = {
  getUserAttendance: async (req, res) => {
    try {
      const attendance = await AttendanceService.getUserAttendance(req.user.id);
      res.json(attendance);
    } catch (error) {
      console.error("Error fetching user attendance:", error);
      res.status(500).json({ error: error.message });
    }
  },

  getAllAttendance: async (req, res) => {
    try {
      const attendance = await AttendanceService.getAllAttendance();
      res.json(attendance);
    } catch (error) {
      console.error("Error fetching all attendance:", error);
      res.status(500).json({ error: error.message });
    }
  },

  checkIn: async (req, res) => {
    try {
      const { latitude, longitude } = req.body;
      
      // Log request data
      console.log('Check-in request:', {
        userId: req.user.id,
        latitude,
        longitude,
        timestamp: new Date().toISOString(),
        headers: req.headers
      });

      // Get current schedule
      const schedule = await AttendanceScheduleModel.get();
      console.log('Current schedule:', schedule);

      // Get office location
      const officeLocation = await OfficeLocationModel.get();
      console.log('Office location:', officeLocation);

      // Check existing attendance
      const today = new Date().toISOString().split('T')[0];
      const existingAttendance = await AttendanceModel.findByUserAndDate(req.user.id, today);
      console.log('Existing attendance:', existingAttendance);

      await AttendanceService.checkIn(req.user.id, latitude, longitude);
      
      console.log('Check-in success:', {
        userId: req.user.id,
        timestamp: new Date().toISOString()
      });

      res.json({ message: "Absensi masuk berhasil" });
    } catch (error) {
      console.error('Check-in error:', {
        userId: req.user?.id,
        error: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString()
      });

      res.status(400).json({ error: error.message });
    }
  },

  checkOut: async (req, res) => {
    try {
      const { latitude, longitude } = req.body;
      await AttendanceService.checkOut(req.user.id, latitude, longitude);
      res.json({ message: "Absensi keluar berhasil" });
    } catch (error) {
      console.error("Error checking out:", error);
      res.status(400).json({ error: error.message });
    }
  }
};

module.exports = attendanceController;