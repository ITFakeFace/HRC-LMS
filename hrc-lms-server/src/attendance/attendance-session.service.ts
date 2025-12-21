import { Injectable } from '@nestjs/common';
import { CreateAttendanceSessionDto } from './dto/create-attendance-session.dto';
import { UpdateAttendanceSessionDto } from './dto/update-attendance-session.dto';
import { AttendanceSessionDto } from './dto/attendance-session.dto';
import { ResponseAttendanceSessionDto } from './dto/response-attendance-session.dto';
import { AttendanceSession } from '@prisma/client';
import { AttendanceRepository } from './attendance.repository';
import { EnrollmentRepository } from 'src/enrollment/enrollment.repository';

@Injectable()
export class AttendanceSessionsService {
  constructor(
    private readonly attendanceRepository: AttendanceRepository,
    private readonly enrollmentRepository: EnrollmentRepository,
  ) {}

  // === 1. CREATE (Tạo phiên và tạo luôn records) ===
  async create(createDto: CreateAttendanceSessionDto): Promise<ResponseAttendanceSessionDto> {
    const res = new ResponseAttendanceSessionDto();

    try {
      // B1: Lấy danh sách ID học sinh đang học trong lớp
      const studentIds = await this.enrollmentRepository.getStudentIdsByClass(createDto.classId);

      // B2: Gọi Repository để tạo Session và Records
      const newSession = await this.attendanceRepository.createSessionWithRecords(
        createDto.classId,
        createDto.openBy, // Giả sử đã validate hoặc lấy từ token ở Controller
        studentIds
      );

      res.session = this.mapToDto(newSession);
    } catch (error) {
      console.error('Lỗi khi tạo Session:', error);
      res.pushError({
        key: 'global',
        value: 'Lỗi không mong muốn khi tạo phiên điểm danh.',
      });
    }

    return res;
  }

  // === 2. FIND ALL (By Class) ===
  async findAllByClass(classId: number): Promise<AttendanceSessionDto[]> {
    const sessions = await this.attendanceRepository.findSessionsByClass(classId);
    return sessions.map(s => this.mapToDto(s));
  }

  // === 3. FIND ONE ===
  async findOne(id: number): Promise<ResponseAttendanceSessionDto> {
    const res = new ResponseAttendanceSessionDto();
    const session = await this.attendanceRepository.findSessionById(id);

    if (!session) {
      res.pushError({ key: 'id', value: `Phiên điểm danh ${id} không tồn tại.` });
      return res;
    }
    
    res.session = this.mapToDto(session);
    return res;
  }

  // === 4. UPDATE (Thường là đóng phiên) ===
  async update(id: number, updateDto: UpdateAttendanceSessionDto): Promise<ResponseAttendanceSessionDto> {
    const res = new ResponseAttendanceSessionDto();

    try {
      // Kiểm tra tồn tại trước
      const existing = await this.attendanceRepository.findSessionById(id);
      if (!existing) {
        res.pushError({ key: 'id', value: `Phiên điểm danh ${id} không tồn tại.` });
        return res;
      }

      // Logic đóng phiên
      if (updateDto.closeAt) {
        const closedSession = await this.attendanceRepository.closeSession(id);
        res.session = this.mapToDto(closedSession);
      } else {
        // Nếu có update khác thì handle ở đây
        res.session = this.mapToDto(existing);
      }
    } catch (error) {
      console.error('Lỗi update Session:', error);
      res.pushError({ key: 'global', value: 'Lỗi hệ thống khi cập nhật phiên.' });
    }

    return res;
  }

  private mapToDto(data: AttendanceSession): AttendanceSessionDto {
    return {
      id: data.id,
      classId: data.classId,
      openBy: data.openBy,
      openAt: data.openAt,
      closeAt: data.closeAt,
      code: data.code,
    };
  }
}