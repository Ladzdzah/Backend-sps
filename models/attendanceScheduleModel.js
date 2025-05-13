const db = require('../config/db');

class AttendanceScheduleModel {
  static async get() {
    const [schedule] = await db.query(
      "SELECT * FROM attendance_schedule LIMIT 1"
    );
    return schedule[0];
  }

  static async update(checkInStart, checkInEnd, checkOutStart, checkOutEnd) {
    await db.query(
      `REPLACE INTO attendance_schedule 
       (id, check_in_start, check_in_end, check_out_start, check_out_end) 
       VALUES (1, ?, ?, ?, ?)`,
      [checkInStart, checkInEnd, checkOutStart, checkOutEnd]
    );
  }
}

module.exports = AttendanceScheduleModel;