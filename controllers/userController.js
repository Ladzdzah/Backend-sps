const UserService = require('../services/userService');
const UserModel = require('../models/userModel'); // Add this line
const bcrypt = require('bcryptjs');

const userController = {
  getAllUsers: async (req, res) => {
    try {
      const users = await UserService.getAllUsers();
      res.json(users);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ error: error.message });
    }
  },

  createUser: async (req, res) => {
    try {
      const result = await UserService.register(req.body);
      res.status(201).json({
        message: "User berhasil dibuat",
        user: result.user
      });
    } catch (error) {
      console.error("Error creating user:", error);
      res.status(400).json({ error: error.message });
    }
  },

  deleteUser: async (req, res) => {
    try {
      await UserService.deleteUser(req.params.id);
      res.json({ message: "User berhasil dihapus" });
    } catch (error) {
      console.error("Error deleting user:", error);
      res.status(400).json({ error: error.message });
    }
  },

  verifyAdminPassword: async (req, res) => {
    try {
      const { password } = req.body;
      const adminId = req.user.id;

      // Get admin user
      const admin = await UserModel.findById(adminId);
      if (!admin || admin.role !== 'admin') {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      // Verify password
      const isValid = await bcrypt.compare(password, admin.password);
      if (!isValid) {
        return res.status(401).json({ error: 'Password admin tidak valid' });
      }

      res.json({ message: 'Password admin valid' });
    } catch (error) {
      console.error('Error verifying admin password:', error);
      res.status(500).json({ error: error.message });
    }
  },

  register: async (req, res) => {
    try {
      const result = await UserService.register(req.body);
      res.status(201).json({
        message: 'User berhasil didaftarkan',
        token: result.token,
        user: result.user
      });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },

  login: async (req, res) => {
    try {
      const result = await UserService.login(req.body);
      res.json({
        message: 'Login berhasil',
        token: result.token,
        user: result.user
      });
    } catch (error) {
      res.status(401).json({ error: error.message });
    }
  },

  resetPassword: async (req, res) => {
    try {
      const { username, newPassword, adminPassword } = req.body;
      const adminId = req.user.id;

      // First verify admin password
      const admin = await UserModel.findById(adminId);
      if (!admin || admin.role !== 'admin') {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      // Verify admin password
      const isValid = await bcrypt.compare(adminPassword, admin.password);
      if (!isValid) {
        return res.status(401).json({ error: 'Password admin tidak valid' });
      }

      // If admin password is valid, proceed with password reset
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      await UserModel.updatePassword(username, hashedPassword);

      res.json({ message: 'Password berhasil direset' });
    } catch (error) {
      console.error('Error resetting password:', error);
      res.status(500).json({ error: error.message });
    }
  }
};

module.exports = userController;