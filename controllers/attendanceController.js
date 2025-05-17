const AttendanceService = require('../services/attendanceService');
const AttendanceScheduleModel = require('../models/attendanceScheduleModel');
const OfficeLocationModel = require('../models/officeLocationModel');
const AttendanceModel = require('../models/attendanceModel');
const UserModel = require('../models/userModel');

const attendanceController = {
  getUserAttendance: async (req, res) => {
    try {
      const attendance = await AttendanceService.getUserAttendance(req.user.id);
      res.json({
        success: true,
        data: attendance
      });
    } catch (error) {
      console.error("Error fetching user attendance:", error);
      res.status(500).json({
        success: false,
        error: error.message || 'Terjadi kesalahan saat mengambil data absensi'
      });
    }
  },

  getAllAttendance: async (req, res) => {
    try {
      const attendance = await AttendanceService.getAllAttendance();
      res.json({
        success: true,
        data: attendance
      });
    } catch (error) {
      console.error("Error fetching all attendance:", error);
      res.status(500).json({
        success: false,
        error: error.message || 'Terjadi kesalahan saat mengambil data absensi'
      });
    }
  },

  checkIn: async (req, res) => {
    try {
      const { latitude, longitude } = req.body;
      
      if (!latitude || !longitude) {
        return res.status(400).json({
          success: false,
          error: 'Data lokasi tidak lengkap'
        });
      }

      // Log request data
      console.log('Check-in request:', {
        userId: req.user.id,
        latitude,
        longitude,
        timestamp: new Date().toISOString()
      });

      const result = await AttendanceService.checkIn(req.user.id, latitude, longitude);
      
      res.json({
        success: true,
        message: "Absensi masuk berhasil",
        data: result
      });
    } catch (error) {
      console.error('Check-in error:', {
        userId: req.user?.id,
        error: error.message,
        stack: error.stack
      });

      // Determine appropriate status code based on error type
      let statusCode = 500;
      if (error.message.includes('sudah melakukan absensi') ||
          error.message.includes('belum melakukan check-out')) {
        statusCode = 400;
      } else if (error.message.includes('di luar area kantor') ||
                 error.message.includes('Waktu absen')) {
        statusCode = 403;
      }

      res.status(statusCode).json({
        success: false,
        error: error.message
      });
    }
  },

  checkOut: async (req, res) => {
    try {
      const { latitude, longitude } = req.body;

      if (!latitude || !longitude) {
        return res.status(400).json({
          success: false,
          error: 'Data lokasi tidak lengkap'
        });
      }

      // Log request data
      console.log('Check-out request:', {
        userId: req.user.id,
        latitude,
        longitude,
        timestamp: new Date().toISOString()
      });

      const result = await AttendanceService.checkOut(req.user.id, latitude, longitude);
      
      res.json({
        success: true,
        message: "Absensi keluar berhasil",
        data: result
      });
    } catch (error) {
      console.error('Check-out error:', {
        userId: req.user?.id,
        error: error.message,
        stack: error.stack
      });

      // Determine appropriate status code based on error type
      let statusCode = 500;
      if (error.message.includes('belum melakukan check-in') ||
          error.message.includes('sudah melakukan check-out')) {
        statusCode = 400;
      } else if (error.message.includes('di luar area kantor') ||
                 error.message.includes('Waktu absen')) {
        statusCode = 403;
      }

      res.status(statusCode).json({
        success: false,
        error: error.message
      });
    }
  },

  getDailyAttendance: async (req, res) => {
    try {
      const { date } = req.query;
      if (!date) {
        return res.status(400).json({ success: false, error: 'Tanggal wajib diisi' });
      }
      // Ambil semua user non-admin
      const users = await UserModel.getAllNonAdmin();
      // Ambil absensi pada tanggal tsb
      const attendance = await AttendanceModel.getAllByDate(date);
      // Gabungkan, jika user tidak ada di attendance, buat record absent
      const result = users.map(user => {
        const att = attendance.find(a => a.user_id === user.id);
        if (att) return att;
        return {
          id: `absent-${user.id}-${date}`,
          user_id: user.id,
          check_in_time: null,
          check_out_time: null,
          check_in_latitude: null,
          check_in_longitude: null,
          check_out_latitude: null,
          check_out_longitude: null,
          status: 'absent',
          created_at: date,
          user: {
            full_name: user.full_name,
            username: user.username
          }
        };
      });
      res.json({ success: true, data: result });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
};

module.exports = attendanceController;