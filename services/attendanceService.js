const AttendanceModel = require('../models/attendanceModel');
const OfficeLocationModel = require('../models/officeLocationModel');
const AttendanceScheduleModel = require('../models/attendanceScheduleModel');

class AttendanceService {
  static async getUserAttendance(userId) {
    return await AttendanceModel.getAllByUser(userId);
  }

  static async getAllAttendance() {
    return await AttendanceModel.getAll();
  }

  static getWIBTime() {
    // Create date in UTC
    const now = new Date();
    // Convert to WIB (UTC+7)
    const wibOffset = 7 * 60; // 7 hours in minutes
    const utcMinutes = now.getUTCHours() * 60 + now.getUTCMinutes();
    const wibMinutes = utcMinutes + wibOffset;
    
    // Handle day rollover
    const wibHours = Math.floor(wibMinutes / 60) % 24;
    const minutes = wibMinutes % 60;
    
    return {
      hours: wibHours,
      minutes: minutes,
      totalMinutes: wibHours * 60 + minutes
    };
  }

  static async checkIn(userId, latitude, longitude) {
    // Check if already checked in today
    const now = new Date();
    const wibDate = new Date(now.getTime() + (7 * 60 * 60 * 1000));
    const today = wibDate.toISOString().split('T')[0];
    const existingAttendance = await AttendanceModel.findByUserAndDate(userId, today);
    
    if (existingAttendance) {
      if (!existingAttendance.check_out_time) {
        throw new Error('Anda belum melakukan check-out untuk absensi sebelumnya');
      }
      throw new Error('Anda sudah melakukan absensi hari ini');
    }

    // Check if within office radius
    const officeLocation = await OfficeLocationModel.get();
    if (!officeLocation) {
      throw new Error('Lokasi kantor belum diatur oleh admin');
    }

    const distance = this.calculateDistance(
      { latitude, longitude },
      { latitude: officeLocation.lat, longitude: officeLocation.lng }
    );

    if (distance > officeLocation.radius) {
      throw new Error(`Anda berada di luar area kantor (${Math.round(distance)}m dari kantor, maksimal ${officeLocation.radius}m)`);
    }

    // Check if within check-in time
    const schedule = await AttendanceScheduleModel.get();
    if (!schedule) {
      throw new Error('Jadwal absensi belum diatur oleh admin');
    }

    const wibTime = this.getWIBTime();
    const currentTimeInMinutes = wibTime.totalMinutes;

    const [startHours, startMinutes] = schedule.check_in_start.split(':').map(Number);
    const [endHours, endMinutes] = schedule.check_in_end.split(':').map(Number);
    
    const startTimeInMinutes = startHours * 60 + startMinutes;
    const endTimeInMinutes = endHours * 60 + endMinutes;

    // Add 15 minutes buffer before and after the scheduled time
    const bufferMinutes = 15;
    const bufferedStartTime = startTimeInMinutes - bufferMinutes;
    const bufferedEndTime = endTimeInMinutes + bufferMinutes;

    if (currentTimeInMinutes < bufferedStartTime || currentTimeInMinutes > bufferedEndTime) {
      throw new Error(`Waktu absen masuk hanya diperbolehkan antara ${this.formatTime(bufferedStartTime)} - ${this.formatTime(bufferedEndTime)} WIB`);
    }

    // Determine status (late or present) based on original time without buffer
    const status = currentTimeInMinutes > startTimeInMinutes ? 'late' : 'present';
    return await AttendanceModel.create(userId, latitude, longitude, status);
  }

  static async checkOut(userId, latitude, longitude) {
    // Check if has checked in today
    const now = new Date();
    const wibDate = new Date(now.getTime() + (7 * 60 * 60 * 1000));
    const today = wibDate.toISOString().split('T')[0];
    const existingAttendance = await AttendanceModel.findByUserAndDate(userId, today);
    
    if (!existingAttendance) {
      throw new Error('Anda belum melakukan check-in hari ini');
    }

    if (existingAttendance.check_out_time) {
      throw new Error('Anda sudah melakukan check-out hari ini');
    }

    // Check if within office radius
    const officeLocation = await OfficeLocationModel.get();
    if (!officeLocation) {
      throw new Error('Lokasi kantor belum diatur oleh admin');
    }

    const distance = this.calculateDistance(
      { latitude, longitude },
      { latitude: officeLocation.lat, longitude: officeLocation.lng }
    );

    if (distance > officeLocation.radius) {
      throw new Error(`Anda berada di luar area kantor (${Math.round(distance)}m dari kantor, maksimal ${officeLocation.radius}m)`);
    }

    // Check if within check-out time
    const schedule = await AttendanceScheduleModel.get();
    if (!schedule) {
      throw new Error('Jadwal absensi belum diatur oleh admin');
    }

    const wibTime = this.getWIBTime();
    const [startHours, startMinutes] = schedule.check_out_start.split(':').map(Number);
    const [endHours, endMinutes] = schedule.check_out_end.split(':').map(Number);
    
    const currentTimeInMinutes = wibTime.totalMinutes;
    const startTimeInMinutes = startHours * 60 + startMinutes;
    const endTimeInMinutes = endHours * 60 + endMinutes;

    // Add buffer time for check-out (15 minutes before and after)
    const bufferMinutes = 15;
    const bufferedStartTime = startTimeInMinutes - bufferMinutes;
    const bufferedEndTime = endTimeInMinutes + bufferMinutes;

    if (currentTimeInMinutes < bufferedStartTime || currentTimeInMinutes > bufferedEndTime) {
      throw new Error(`Waktu absen keluar hanya diperbolehkan antara ${this.formatTime(bufferedStartTime)} - ${this.formatTime(bufferedEndTime)} WIB`);
    }

    // Update the model with WIB date
    try {
    const result = await AttendanceModel.updateCheckOut(userId, latitude, longitude);
    if (result === 0) {
        throw new Error('Tidak ada absensi masuk yang aktif untuk hari ini');
    }
    return result;
    } catch (error) {
      console.error('Check-out error:', error);
      throw new Error('Gagal melakukan check-out. Silakan coba lagi atau hubungi admin.');
    }
  }

  static calculateDistance(point1, point2) {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = this.toRadians(point1.latitude);
    const φ2 = this.toRadians(point2.latitude);
    const Δφ = this.toRadians(point2.latitude - point1.latitude);
    const Δλ = this.toRadians(point2.longitude - point1.longitude);

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c; // Distance in meters
  }

  static toRadians(degrees) {
    return degrees * Math.PI / 180;
  }

  static formatTime(timeInMinutes) {
    const hours = Math.floor(timeInMinutes / 60);
    const minutes = timeInMinutes % 60;
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
  }
}

module.exports = AttendanceService;