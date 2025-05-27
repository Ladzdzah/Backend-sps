const AttendanceService = require('../services/attendanceService');

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
      await AttendanceService.checkIn(req.user.id, latitude, longitude);
      res.json({ message: "Absensi masuk berhasil" });
    } catch (error) {
      console.error("Error checking in:", error);
      res.status(400).json({ error: error.message });
    }
  },

  checkOut: async (req, res) => {
    try {
      const { latitude, longitude, status } = req.body;
      const result = await AttendanceService.checkOut(req.user.id, latitude, longitude, 'late');
      res.json({ 
        message: "Absensi keluar berhasil",
        status: 'late'
      });
    } catch (error) {
      console.error("Error checking out:", error);
      res.status(400).json({ error: error.message });
    }
  }
};

module.exports = attendanceController;