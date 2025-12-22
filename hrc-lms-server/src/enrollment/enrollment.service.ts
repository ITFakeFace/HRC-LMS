import { Injectable } from '@nestjs/common';
import { CreateEnrollmentDto } from './dto/create-enrollment.dto';
import { UpdateEnrollmentDto } from './dto/update-enrollment.dto';
import { EnrollmentDto } from './dto/enrollment.dto';
import { ResponseEnrollmentDto } from './dto/response-enrollment.dto';
import { Enrollment } from '@prisma/client';
import { EnrollmentRepository } from './enrollment.repository';

@Injectable()
export class EnrollmentsService {
  constructor(private readonly enrollmentRepository: EnrollmentRepository) {}

  // === CREATE ===
  async create(createEnrollmentDto: CreateEnrollmentDto): Promise<ResponseEnrollmentDto> {
    const res = new ResponseEnrollmentDto();

    // 1. Check trùng
    const exists = await this.enrollmentRepository.findByStudentAndClass(
      createEnrollmentDto.studentId,
      createEnrollmentDto.classId,
    );

    if (exists) {
      res.pushError({ key: 'global', value: 'Học sinh đã có trong lớp này.' });
      return res;
    }

    // 2. Tạo mới
    try {
      const newEnrollment = await this.enrollmentRepository.create(createEnrollmentDto);
      res.enrollment = this.mapToDto(newEnrollment);
    } catch (error) {
      console.error('Enrollment Error:', error);
      res.pushError({ key: 'global', value: 'Lỗi khi đăng ký học.' });
    }

    return res;
  }

  // === UPDATE ===
  async update(id: number, dto: UpdateEnrollmentDto): Promise<ResponseEnrollmentDto> {
    const res = new ResponseEnrollmentDto();
    try {
      if (dto.status) {
        const updated = await this.enrollmentRepository.updateStatus(id, dto.status);
        res.enrollment = this.mapToDto(updated);
      }
    } catch (error) {
      res.pushError({ key: 'id', value: 'Không tìm thấy enrollment hoặc lỗi server.' });
    }
    return res;
  }

  // === GET SCHEDULE (Lịch học của tôi) ===
  // Hàm này trả về Array Session, không phải EnrollmentDto nên ta return any hoặc DTO riêng
  async getMySchedule(studentId: number, fromDate: string, toDate: string) {
    const start = new Date(fromDate);
    const end = new Date(toDate);
    
    // Gọi Repository
    const sessions = await this.enrollmentRepository.getMySchedule(studentId, start, end);
    
    // Map dữ liệu để FE dễ dùng
    return sessions.map(s => ({
      date: s.date,
      startTime: s.startTime,
      endTime: s.endTime,
      className: s.class.name,
      classCode: s.class.code,
      sessionTitle: s.title,
      // Lấy trạng thái điểm danh của bản thân (nếu buổi đó đã bắt đầu)
      myAttendanceStatus: s.records.length > 0 ? s.records[0].status : null,
      myCheckInTime: s.records.length > 0 ? s.records[0].checkInAt : null,
    }));
  }

  private mapToDto(data: Enrollment): EnrollmentDto {
    return {
      id: data.id,
      studentId: data.studentId,
      classId: data.classId,
      joinedAt: data.joinedAt,
      status: data.status,
    };
  }
}