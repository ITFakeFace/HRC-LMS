import { Injectable } from '@nestjs/common';
import { UpdateAttendanceRecordDto } from './dto/update-attendance-record.dto';
import { AttendanceRecordDto } from './dto/attendance-record.dto';
import { ResponseAttendanceRecordDto } from './dto/response-attendance-record.dto';
import { AttendanceRecord } from '@prisma/client';
import { AttendanceStatus } from '@prisma/client';
import { AttendanceRecordRepository } from './attendance.repository';

@Injectable()
export class AttendanceRecordsService {
  constructor(private readonly recordRepository: AttendanceRecordRepository) {}

  // === CHECK IN (SỬA LẠI: Có Validate QR Code) ===
  async checkIn(sessionId: number, studentId: number, code: string): Promise<ResponseAttendanceRecordDto> {
    const res = new ResponseAttendanceRecordDto();

    // 1. Kiểm tra Session có đang mở và Code có đúng không
    const session = await this.recordRepository.getSessionAuthInfo(sessionId);

    if (!session) {
      res.pushError({ key: 'sessionId', value: 'Buổi học không tồn tại.' });
      return res;
    }

    if (!session.isAttendanceOpen) {
      res.pushError({ key: 'global', value: 'Điểm danh đang đóng.' });
      return res;
    }

    // 2. So sánh mã QR
    if (session.attendanceCode !== code) {
      res.pushError({ key: 'code', value: 'Mã QR không hợp lệ hoặc sai lớp.' });
      return res;
    }

    // 3. Thực hiện điểm danh
    try {
      const updatedRecord = await this.recordRepository.checkIn(sessionId, studentId);
      res.record = this.mapToDto(updatedRecord);
    } catch (error) {
      // P2025: Record to update not found
      if (error.code === 'P2025') {
        res.pushError({ 
          key: 'global', 
          value: 'Bạn không có tên trong danh sách lớp học này.' 
        });
      } else {
        console.error(error);
        res.pushError({ key: 'global', value: 'Lỗi hệ thống khi điểm danh.' });
      }
    }
    return res;
  }

  // === UPDATE MANUAL (Giáo viên sửa) ===
  async updateManual(
    sessionId: number, 
    studentId: number, 
    dto: UpdateAttendanceRecordDto
  ): Promise<ResponseAttendanceRecordDto> {
    const res = new ResponseAttendanceRecordDto();
    
    try {
      const updated = await this.recordRepository.updateManual(
        sessionId, 
        studentId, 
        dto.status || AttendanceStatus.PRESENT, 
        dto.note
      );
      res.record = this.mapToDto(updated);
    } catch (error) {
      res.pushError({ key: 'global', value: 'Lỗi cập nhật điểm danh.' });
    }
    return res;
  }

  // === FIND BY STUDENT IN CLASS ===
  async findByStudentInClass(studentId: number, classId: number): Promise<AttendanceRecordDto[]> {
    const records = await this.recordRepository.findByStudentInClass(studentId, classId);
    return records.map(r => this.mapToDto(r));
  }

  // === 🆕 HÀM THỐNG KÊ ===
  async getSessionStatistics(sessionId: number) {
    const { stats, total } = await this.recordRepository.getSessionStatistics(sessionId);

    // Format lại dữ liệu cho đẹp
    let presentCount = 0;
    let absentCount = 0;
    let excusedCount = 0; // Có phép (nếu enum có)

    stats.forEach(item => {
      if (item.status === AttendanceStatus.PRESENT) presentCount = item._count.status;
      if (item.status === AttendanceStatus.ABSENT) absentCount = item._count.status;
      // if (item.status === 'EXCUSED') excusedCount = item._count.status;
    });

    return {
      sessionId,
      totalStudents: total,
      attendedStudents: presentCount,
      absentStudents: absentCount,
      // attendanceRate: total > 0 ? (presentCount / total) * 100 : 0
    };
  }

  private mapToDto(data: AttendanceRecord): AttendanceRecordDto {
    return {
      id: data.id,
      sessionId: data.sessionId,
      stdId: data.stdId,
      status: data.status,
      note: data.note,
      checkInAt: data.checkInAt,
    };
  }

  async findAllBySession(sessionId: number) {
    const records = await this.recordRepository.findAllBySession(sessionId);
    // Có thể map lại DTO nếu cần, hoặc trả về raw luôn
    return records;
  }
}