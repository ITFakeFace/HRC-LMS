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

  // === CHECK IN (Sinh viên quét QR) ===
  async checkIn(sessionId: number, studentId: number): Promise<ResponseAttendanceRecordDto> {
    const res = new ResponseAttendanceRecordDto();

    try {
      const updatedRecord = await this.recordRepository.checkIn(sessionId, studentId);
      res.record = this.mapToDto(updatedRecord);
    } catch (error) {
      console.error('CheckIn Error:', error);
      if (error.code === 'P2025') {
        res.pushError({ 
          key: 'global', 
          value: 'Không tìm thấy lượt điểm danh (Có thể lớp chưa bắt đầu hoặc bạn không có trong lớp).' 
        });
      } else {
        res.pushError({ key: 'global', value: 'Lỗi khi điểm danh.' });
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
}