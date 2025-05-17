const db = require('../config/db');

class UserModel {
  static async findByUsername(username) {
    const [users] = await db.query('SELECT * FROM users WHERE username = ?', [username]);
    return users[0];
  }

  static async findById(id) {
    const [users] = await db.query('SELECT * FROM users WHERE id = ?', [id]);
    return users[0];
  }

  static async findByRole(role) {
    const [users] = await db.query('SELECT * FROM users WHERE role = ?', [role]);
    return users[0];
  }

  static async findAll() {
    const [users] = await db.query('SELECT id, username, full_name, role FROM users');
    return users;
  }

  static async create(userData) {
    const { username, password, full_name, role } = userData;
    const [result] = await db.query(
      'INSERT INTO users (username, password, full_name, role) VALUES (?, ?, ?, ?)',
      [username, password, full_name, role]
    );
    return result.insertId;
  }

  static async updatePassword(username, hashedPassword) {
    const [result] = await db.query(
      'UPDATE users SET password = ? WHERE username = ?',
      [hashedPassword, username]
    );
    
    if (result.affectedRows === 0) {
      throw new Error('User tidak ditemukan');
    }
    
    return true;
  }

  static async delete(id) {
    await db.query('DELETE FROM users WHERE id = ?', [id]);
  }

  static async getAllNonAdmin() {
    const [users] = await db.query('SELECT id, username, full_name, role FROM users WHERE role != \'admin\'' );
    return users;
  }
}

module.exports = UserModel;