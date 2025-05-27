const db = require('../config/db');

class AttendanceModel {
  static async findByUserAndDate(userId, date) {
    const [rows] = await db.query(
      `SELECT * FROM attendance 
       WHERE user_id = ? 
       AND DATE(COALESCE(check_in_time, check_out_time)) = ?`,
      [userId, date]
    );
    return rows[0];
  }

  static async create(userId, latitude, longitude, status) {
    const [result] = await db.query(
      `INSERT INTO attendance 
       (user_id, check_in_time, check_in_latitude, check_in_longitude, status) 
       VALUES (?, NOW(), ?, ?, ?)`,
      [userId, latitude, longitude, status]
    );
    return result.insertId;
  }

  static async createLateCheckOut(userId, latitude, longitude) {
    const [result] = await db.query(
      `INSERT INTO attendance 
       (user_id, check_out_time, check_out_latitude, check_out_longitude, status) 
       VALUES (?, NOW(), ?, ?, 'late')`,
      [userId, latitude, longitude]
    );
    return result.insertId;
  }

  static async updateCheckOut(userId, latitude, longitude) {
    const [result] = await db.query(
      `UPDATE attendance 
       SET check_out_time = NOW(),
           check_out_latitude = ?,
           check_out_longitude = ?,
           status = CASE 
             WHEN check_in_time IS NULL THEN 'late'
             ELSE 'present'
           END
       WHERE user_id = ? 
       AND DATE(COALESCE(check_in_time, check_out_time)) = CURDATE()
       AND check_out_time IS NULL`,
      [latitude, longitude, userId]
    );
    return result.affectedRows;
  }

  static async getAllByUser(userId) {
    const [rows] = await db.query(
      `SELECT * FROM attendance 
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
        u.username,
        u.full_name,
        CASE 
          WHEN a.check_in_time IS NULL AND a.check_out_time IS NOT NULL THEN 'late'
          WHEN a.check_in_time IS NOT NULL AND a.check_out_time IS NOT NULL THEN 'present'
          WHEN a.check_in_time IS NOT NULL THEN 'present'
          ELSE 'absent'
        END as status
      FROM attendance a
      JOIN users u ON a.user_id = u.id
      WHERE (a.check_in_time IS NOT NULL OR a.check_out_time IS NOT NULL)
        AND u.role != 'admin'
      ORDER BY COALESCE(a.check_in_time, a.check_out_time) DESC
    `);
    return rows;
  }
}

module.exports = AttendanceModel;