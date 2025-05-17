const db = require('../config/db');

class AttendanceModel {
  static async findByUserAndDate(userId, date) {
    const [attendance] = await db.query(
      `SELECT * FROM attendance 
       WHERE user_id = ? AND DATE(CONVERT_TZ(check_in_time, '+00:00', '+07:00')) = ?`,
      [userId, date]
    );
    return attendance[0];
  }

  static async create(userId, latitude, longitude, status) {
    const [result] = await db.query(
      `INSERT INTO attendance 
       (user_id, check_in_time, check_in_latitude, check_in_longitude, status) 
       VALUES (?, CONVERT_TZ(NOW(), '+00:00', '+07:00'), ?, ?, ?)`,
      [userId, latitude, longitude, status]
    );
    return result.insertId;
  }

  static async updateCheckOut(userId, latitude, longitude) {
    const [result] = await db.query(
      `UPDATE attendance 
       SET check_out_time = CONVERT_TZ(NOW(), '+00:00', '+07:00'),
           check_out_latitude = ?,
           check_out_longitude = ?
       WHERE user_id = ? 
       AND DATE(CONVERT_TZ(check_in_time, '+00:00', '+07:00')) = DATE(CONVERT_TZ(NOW(), '+00:00', '+07:00'))
       AND check_out_time IS NULL`,
      [latitude, longitude, userId]
    );
    return result.affectedRows;
  }

  static async getAllByUser(userId) {
    const [rows] = await db.query(
      `SELECT 
         *,
         CONVERT_TZ(check_in_time, '+00:00', '+07:00') as check_in_time,
         CONVERT_TZ(check_out_time, '+00:00', '+07:00') as check_out_time
       FROM attendance 
       WHERE user_id = ? 
       ORDER BY check_in_time DESC`,
      [userId]
    );
    return rows;
  }

  static async getAll() {
    const [rows] = await db.query(`
      SELECT 
        a.*,
        CONVERT_TZ(a.check_in_time, '+00:00', '+07:00') as check_in_time,
        CONVERT_TZ(a.check_out_time, '+00:00', '+07:00') as check_out_time,
        u.username,
        u.full_name
      FROM attendance a
      JOIN users u ON a.user_id = u.id
      WHERE a.check_in_time IS NOT NULL
        AND u.role != 'admin'
      ORDER BY a.check_in_time DESC
    `);
    return rows.map(row => ({ ...row, status: row.status || 'hadir' }));
  }

  static async getAllByDate(date) {
    const [rows] = await db.query(`
      SELECT 
        a.*,
        CONVERT_TZ(a.check_in_time, '+00:00', '+07:00') as check_in_time,
        CONVERT_TZ(a.check_out_time, '+00:00', '+07:00') as check_out_time,
        u.username,
        u.full_name
      FROM attendance a
      JOIN users u ON a.user_id = u.id
      WHERE DATE(CONVERT_TZ(a.check_in_time, '+00:00', '+07:00')) = ?
        AND u.role != 'admin'
      ORDER BY a.check_in_time DESC
    `, [date]);
    return rows.map(row => ({ ...row, status: row.status || 'Hadir' }));
  }
}

module.exports = AttendanceModel;