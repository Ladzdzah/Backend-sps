const AttendanceScheduleService = require('../services/attendanceScheduleService');

const attendanceScheduleController = {
  getAttendanceSchedule: async (req, res) => {
    try {
      const schedule = await AttendanceScheduleService.getSchedule();
      res.json(schedule);
    } catch (error) {
      console.error("Error fetching schedule:", error);
      res.status(500).json({ error: error.message });
    }
  },

  updateAttendanceSchedule: async (req, res) => {
    try {
      const { check_in_start, check_in_end, check_out_start, check_out_end } = req.body;
      await AttendanceScheduleService.updateSchedule(
        check_in_start,
        check_in_end,
        check_out_start,
        check_out_end
      );
      res.json({ message: "Jadwal absensi berhasil diperbarui" });
    } catch (error) {
      console.error("Error updating schedule:", error);
      res.status(400).json({ error: error.message });
    }
  }
};

module.exports = attendanceScheduleController;