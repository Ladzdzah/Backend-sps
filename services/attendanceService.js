const AttendanceModel = require('../models/attendanceModel');
const OfficeLocationModel = require('../models/officeLocationModel');
const AttendanceScheduleModel = require('../models/attendanceScheduleModel');

class AttendanceService {
  static async getUserAttendance(userId) {
    try {
      const attendance = await AttendanceModel.getAllByUser(userId);
      return attendance.map(record => {
        // Ensure dates are properly formatted as ISO strings
        const checkInTime = record.check_in_time ? this.convertToWIB(new Date(record.check_in_time)).toISOString() : null;
        const checkOutTime = record.check_out_time ? this.convertToWIB(new Date(record.check_out_time)).toISOString() : null;
        
        return {
          id: record.id,
          user_id: record.user_id,
          check_in_time: checkInTime,
          check_out_time: checkOutTime,
          check_in_location: record.check_in_location,
          check_out_location: record.check_out_location,
          status: record.status || 'present',
          created_at: record.created_at ? new Date(record.created_at).toISOString() : null,
          updated_at: record.updated_at ? new Date(record.updated_at).toISOString() : null
        };
      });
    } catch (error) {
      console.error('Error getting user attendance:', error);
      throw new Error('Gagal mengambil data absensi');
    }
  }

  static async getAllAttendance() {
    try {
      const attendance = await AttendanceModel.getAll();
      return attendance.map(record => {
        // Ensure dates are properly formatted as ISO strings
        const checkInTime = record.check_in_time ? this.convertToWIB(new Date(record.check_in_time)).toISOString() : null;
        const checkOutTime = record.check_out_time ? this.convertToWIB(new Date(record.check_out_time)).toISOString() : null;
        
        return {
          id: record.id,
          user_id: record.user_id,
          check_in_time: checkInTime,
          check_out_time: checkOutTime,
          check_in_location: record.check_in_location,
          check_out_location: record.check_out_location,
          status: record.status || 'present',
          created_at: record.created_at ? new Date(record.created_at).toISOString() : null,
          updated_at: record.updated_at ? new Date(record.updated_at).toISOString() : null
        };
      });
    } catch (error) {
      console.error('Error getting all attendance:', error);
      throw new Error('Gagal mengambil data absensi');
    }
  }

  static convertToWIB(date) {
    return new Date(date.getTime() + (7 * 60 * 60 * 1000));
  }

  static getWIBTime() {
    const now = new Date();
    const wibOffset = 7 * 60;
    const utcMinutes = now.getUTCHours() * 60 + now.getUTCMinutes();
    const wibMinutes = utcMinutes + wibOffset;
    
    const wibHours = Math.floor(wibMinutes / 60) % 24;
    const minutes = wibMinutes % 60;
    
    return {
      hours: wibHours,
      minutes: minutes,
      totalMinutes: wibHours * 60 + minutes,
      date: this.convertToWIB(now)
    };
  }

  static async validateLocation(latitude, longitude) {
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

    return { distance, officeLocation };
  }

  static async validateSchedule(type = 'check_in') {
    const schedule = await AttendanceScheduleModel.get();
    if (!schedule) {
      throw new Error('Jadwal absensi belum diatur oleh admin');
    }

    const wibTime = this.getWIBTime();
    const [startHours, startMinutes] = schedule[`${type}_start`].split(':').map(Number);
    const [endHours, endMinutes] = schedule[`${type}_end`].split(':').map(Number);
    
    const currentTimeInMinutes = wibTime.totalMinutes;
    const startTimeInMinutes = startHours * 60 + startMinutes;
    const endTimeInMinutes = endHours * 60 + endMinutes;

    // Add buffer time (15 minutes before and after)
    const bufferMinutes = 15;
    const bufferedStartTime = startTimeInMinutes - bufferMinutes;
    const bufferedEndTime = endTimeInMinutes + bufferMinutes;

    if (currentTimeInMinutes < bufferedStartTime || currentTimeInMinutes > bufferedEndTime) {
      throw new Error(`Waktu absen ${type === 'check_in' ? 'masuk' : 'keluar'} hanya diperbolehkan antara ${this.formatTime(bufferedStartTime)} - ${this.formatTime(bufferedEndTime)} WIB`);
    }

    return {
      isLate: type === 'check_in' && currentTimeInMinutes > startTimeInMinutes,
      schedule
    };
  }

  static async checkIn(userId, latitude, longitude) {
    try {
      // Validate today's attendance
      const wibTime = this.getWIBTime();
      const today = wibTime.date.toISOString().split('T')[0];
      const existingAttendance = await AttendanceModel.findByUserAndDate(userId, today);
      
      if (existingAttendance) {
        if (!existingAttendance.check_out_time) {
          throw new Error('Anda belum melakukan check-out untuk absensi sebelumnya');
        }
        throw new Error('Anda sudah melakukan absensi hari ini');
      }

      // Validate location
      await this.validateLocation(latitude, longitude);

      // Validate schedule
      const { isLate } = await this.validateSchedule('check_in');

      // Create attendance record
      const status = isLate ? 'late' : 'present';
      const result = await AttendanceModel.create(userId, latitude, longitude, status);
      
      console.log('Check-in success:', {
        userId,
        status,
        timestamp: wibTime.date.toISOString()
      });

      return result;
    } catch (error) {
      console.error('Check-in error:', {
        userId,
        error: error.message,
        stack: error.stack
      });
      throw error;
    }
  }

  static async checkOut(userId, latitude, longitude) {
    try {
      // Validate today's attendance
      const wibTime = this.getWIBTime();
      const today = wibTime.date.toISOString().split('T')[0];
      const existingAttendance = await AttendanceModel.findByUserAndDate(userId, today);
      
      if (!existingAttendance) {
        throw new Error('Anda belum melakukan check-in hari ini');
      }

      if (existingAttendance.check_out_time) {
        throw new Error('Anda sudah melakukan check-out hari ini');
      }

      // Validate location
      await this.validateLocation(latitude, longitude);

      // Validate schedule
      await this.validateSchedule('check_out');

      // Update check-out time
      const result = await AttendanceModel.updateCheckOut(userId, latitude, longitude);
      if (result === 0) {
        throw new Error('Tidak ada absensi masuk yang aktif untuk hari ini');
      }

      console.log('Check-out success:', {
        userId,
        timestamp: wibTime.date.toISOString()
      });

      return result;
    } catch (error) {
      console.error('Check-out error:', {
        userId,
        error: error.message,
        stack: error.stack
      });
      throw error;
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