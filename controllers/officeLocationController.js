const OfficeLocationService = require('../services/officeLocationService');

const officeLocationController = {
  getOfficeLocation: async (req, res) => {
    try {
      const location = await OfficeLocationService.getLocation();
      res.json(location);
    } catch (error) {
      console.error("Error fetching office location:", error);
      res.status(500).json({ error: error.message });
    }
  },

  updateOfficeLocation: async (req, res) => {
    try {
      const { lat, lng, radius } = req.body;
      await OfficeLocationService.updateLocation(lat, lng, radius);
      res.json({ message: "Lokasi kantor berhasil diperbarui" });
    } catch (error) {
      console.error("Error updating office location:", error);
      res.status(400).json({ error: error.message });
    }
  }
};

module.exports = officeLocationController;