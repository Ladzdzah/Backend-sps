const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const UserModel = require('../models/userModel');

class UserService {
  static async register(userData) {
    const existingUser = await UserModel.findByUsername(userData.username);
    if (existingUser) {
      throw new Error('Username sudah terdaftar');
    }

    const hashedPassword = await bcrypt.hash(userData.password, 10);
    const userId = await UserModel.create({
      ...userData,
      password: hashedPassword
    });

    const user = await UserModel.findById(userId);
    const token = this.generateToken(user);

    return { user, token };
  }

  static async login(credentials) {
    const user = await UserModel.findByUsername(credentials.username);
    if (!user) {
      throw new Error('Username tidak terdaftar');
    }

    const isValidPassword = await bcrypt.compare(credentials.password, user.password);
    if (!isValidPassword) {
      throw new Error('Password salah');
    }

    const token = this.generateToken(user);
    return { user, token };
  }

  static async getAllUsers() {
    return await UserModel.findAll();
  }

  static async deleteUser(userId) {
    return await UserModel.delete(userId);
  }

  static async findById(id) {
    return await UserModel.findById(id);
  }

  static async verifyAdminPassword(userId, password) {
    const admin = await UserModel.findById(userId);
    if (!admin || admin.role !== 'admin') {
      throw new Error('User bukan admin');
    }

    const isValidPassword = await bcrypt.compare(password, admin.password);
    if (!isValidPassword) {
      throw new Error('Password admin tidak valid');
    }

    return true;
  }

  static async resetPassword(username, newPassword) {
    const user = await UserModel.findByUsername(username);
    if (!user) {
      throw new Error('User tidak ditemukan');
    }

    // Hash password baru
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    // Update password
    await UserModel.updatePassword(username, hashedPassword);
    
    return { message: 'Password berhasil direset' };
  }

  static generateToken(user) {
    return jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );
  }
}

module.exports = UserService;