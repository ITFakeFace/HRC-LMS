import { Injectable } from '@nestjs/common';
import { Enrollment } from '@prisma/client';
import { EnrollmentRepository } from './enrollment.repository';
import { ResponseEnrollmentDto } from './dto/response-enrollment.dto';
import { CreateEnrollmentDto } from './dto/create-enrollment.dto';
import { EnrollmentDto } from './dto/enrollment.dto';
import { UpdateEnrollmentDto } from './dto/update-enrollment.dto';

@Injectable()
export class EnrollmentsService {
  constructor(private readonly enrollmentRepository: EnrollmentRepository) {}

  // === 1. CREATE ===
  async create(createEnrollmentDto: CreateEnrollmentDto): Promise<ResponseEnrollmentDto> {
    const res = new ResponseEnrollmentDto();

    // 1. Validate: Kiểm tra xem học sinh đã có trong lớp chưa
    const existingEnrollment = await this.enrollmentRepository.findByStudentAndClass(
      createEnrollmentDto.studentId,
      createEnrollmentDto.classId
    );

    if (existingEnrollment) {
      res.pushError({
        key: 'global',
        value: 'Học sinh này đã được đăng ký vào lớp học này rồi.',
      });
      return res;
    }

    // 2. Thực thi
    try {
      const newEnrollment = await this.enrollmentRepository.create(createEnrollmentDto);
      res.enrollment = this.mapToDto(newEnrollment);
    } catch (error) {
      console.error('Lỗi khi tạo Enrollment:', error);
      res.pushError({
        key: 'global',
        value: 'Lỗi không mong muốn khi đăng ký học.',
      });
    }

    return res;
  }

  // === 2. FIND ALL (By Student) ===
  async findAllByStudent(studentId: number): Promise<EnrollmentDto[]> {
    const enrollments = await this.enrollmentRepository.findByStudent(studentId);
    return enrollments.map(e => this.mapToDto(e));
  }

  // === 3. UPDATE ===
  async update(id: number, updateEnrollmentDto: UpdateEnrollmentDto): Promise<ResponseEnrollmentDto> {
    const res = new ResponseEnrollmentDto();

    try {
      // Vì repository updateStatus nhận id và status, ta cần check logic chút
      if (updateEnrollmentDto.status) {
        const updated = await this.enrollmentRepository.updateStatus(id, updateEnrollmentDto.status);
        res.enrollment = this.mapToDto(updated);
      } else {
         // Nếu không có status gửi lên thì không làm gì (hoặc handle logic khác tùy DB)
         res.pushError({ key: 'status', value: 'Cần cung cấp trạng thái để cập nhật' });
      }
    } catch (error) {
      console.error('Lỗi khi update Enrollment:', error);
      if (error.code === 'P2025') {
        res.pushError({ key: 'id', value: `Đăng ký với ID ${id} không tồn tại.` });
      } else {
        res.pushError({ key: 'global', value: 'Lỗi khi cập nhật trạng thái học.' });
      }
    }

    return res;
  }

  // === 4. REMOVE ===
  async remove(id: number): Promise<ResponseEnrollmentDto> {
    const res = new ResponseEnrollmentDto();
    try {
      const deleted = await this.enrollmentRepository.delete(id);
      res.enrollment = this.mapToDto(deleted);
    } catch (error) {
      res.pushError({
        key: 'id',
        value: `Không thể xóa đăng ký ID ${id} (không tồn tại hoặc lỗi server).`,
      });
    }
    return res;
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