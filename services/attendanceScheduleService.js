const AttendanceScheduleModel = require('../models/attendanceScheduleModel');

class AttendanceScheduleService {
  static async getSchedule() {
    const schedule = await AttendanceScheduleModel.get();
    if (!schedule) {
      throw new Error('Jadwal absensi belum diatur');
    }
    return schedule;
  }

  static async updateSchedule(checkInStart, checkInEnd, checkOutStart, checkOutEnd) {
    const isValidTime = (time) => /^([01]\d|2[0-3]):([0-5]\d):([0-5]\d)$/.test(time);

    if (!isValidTime(checkInStart) || !isValidTime(checkInEnd) || 
        !isValidTime(checkOutStart) || !isValidTime(checkOutEnd)) {
      throw new Error('Format waktu tidak valid (HH:mm:ss)');
    }

    if (checkInEnd <= checkInStart || checkOutEnd <= checkOutStart) {
      throw new Error('Waktu selesai harus lebih besar dari waktu mulai');
    }

    if (checkOutStart <= checkInEnd) {
      throw new Error('Waktu absen keluar harus setelah waktu absen masuk selesai');
    }

    await AttendanceScheduleModel.update(checkInStart, checkInEnd, checkOutStart, checkOutEnd);
  }
}

module.exports = AttendanceScheduleService;