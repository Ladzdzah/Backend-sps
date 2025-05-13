const UserService = require('../services/userService');

const authController = {
  register: async (req, res) => {
    try {
      console.log("Data diterima di backend:", req.body); // Tambahkan logging
      const result = await UserService.register(req.body);
      res.status(201).json({
        message: "User berhasil didaftarkan",
        token: result.token,
        user: result.user
      });
    } catch (error) {
      console.error("Error in register:", error);
      res.status(400).json({ error: error.message });
    }
  },

  loginUser: async (req, res) => {
    try {
      const result = await UserService.login(req.body);
      res.json({
        message: "Login berhasil",
        token: result.token,
        user: result.user
      });
    } catch (error) {
      console.error("Error in login:", error);
      res.status(401).json({ error: error.message });
    }
  },

  resetPassword: async (req, res) => {
    try {
      const { username, newPassword } = req.body;
      await UserService.resetPassword(username, newPassword);
      res.json({ message: "Password berhasil direset" });
    } catch (error) {
      console.error("Error in resetPassword:", error);
      res.status(400).json({ error: error.message });
    }
  }
};

module.exports = {
  register: authController.register,
  loginUser: authController.loginUser,
  resetPassword: authController.resetPassword
};