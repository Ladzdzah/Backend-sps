const OfficeLocationModel = require('../models/officeLocationModel');

class OfficeLocationService {
  static async getLocation() {
    return await OfficeLocationModel.get();
  }

  static async updateLocation(lat, lng, radius) {
    // Validate coordinates
    if (lat < -90 || lat > 90) {
      throw new Error('Latitude harus antara -90 dan 90');
    }
    if (lng < -180 || lng > 180) {
      throw new Error('Longitude harus antara -180 dan 180');
    }
    if (radius <= 0) {
      throw new Error('Radius harus lebih besar dari 0');
    }

    await OfficeLocationModel.update(lat, lng, radius);
  }
}

module.exports = OfficeLocationService;