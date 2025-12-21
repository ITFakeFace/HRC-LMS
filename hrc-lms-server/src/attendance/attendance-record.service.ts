import { Injectable } from '@nestjs/common';
import { CreateAttendanceRecordDto } from './dto/create-attendance-record.dto'; // Thường ít dùng Create vì tạo tự động theo Session
import { UpdateAttendanceRecordDto } from './dto/update-attendance-record.dto';
import { AttendanceRecordDto } from './dto/attendance-record.dto';
import { ResponseAttendanceRecordDto } from './dto/response-attendance-record.dto';
import { AttendanceRecord } from '@prisma/client';
import { AttendanceRepository } from './attendance.repository';

@Injectable()
export class AttendanceRecordsService {
  constructor(private readonly attendanceRepository: AttendanceRepository) {}

  // === UPDATE (Điểm danh: Có mặt, vắng...) ===
  async update(
    sessionId: number, 
    studentId: number, 
    updateDto: UpdateAttendanceRecordDto
  ): Promise<ResponseAttendanceRecordDto> {
    const res = new ResponseAttendanceRecordDto();

    if (!updateDto.status) {
      res.pushError({ key: 'status', value: 'Trạng thái điểm danh là bắt buộc.' });
      return res;
    }

    try {
      const updatedRecord = await this.attendanceRepository.updateRecord(
        sessionId,
        studentId,
        updateDto.status,
        updateDto.note
      );

      res.record = this.mapToDto(updatedRecord);
    } catch (error) {
      console.error('Lỗi điểm danh:', error);
      if (error.code === 'P2025') {
        res.pushError({ 
          key: 'global', 
          value: 'Không tìm thấy bản ghi điểm danh (Sai SessionID hoặc StudentID).' 
        });
      } else {
        res.pushError({ key: 'global', value: 'Lỗi hệ thống khi điểm danh.' });
      }
    }

    return res;
  }

  // === FIND BY STUDENT IN CLASS ===
  async findAllByStudent(studentId: number, classId: number): Promise<AttendanceRecordDto[]> {
    const records = await this.attendanceRepository.getStudentRecordsInClass(studentId, classId);
    return records.map(r => this.mapToDto(r));
  }

  private mapToDto(data: AttendanceRecord): AttendanceRecordDto {
    return {
      id: data.id,
      sessionId: data.sessionId,
      stdId: data.stdId,
      status: data.status,
      note: data.note,
    };
  }
}