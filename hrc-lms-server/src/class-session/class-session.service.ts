import { Injectable } from '@nestjs/common';
import { UpdateClassSessionDto } from './dto/update-class-session.dto';
import { ClassSessionDto } from './dto/class-session.dto';
import { ResponseClassSessionDto } from './dto/response-class-session.dto';
import { ClassSession, SessionStatus } from '@prisma/client';
import { ClassSessionRepository } from './class-session.repository';
import { EnrollmentRepository } from 'src/enrollment/enrollment.repository';

@Injectable()
export class ClassSessionsService {
  constructor(
    private readonly sessionRepository: ClassSessionRepository,
    private readonly enrollmentRepository: EnrollmentRepository,
  ) {}

  // =========================================================================
  //                                READ
  // =========================================================================

  // === FIND BY CLASS ===
  async findAllByClass(classId: number): Promise<ClassSessionDto[]> {
    const sessions = await this.sessionRepository.findByClass(classId);
    return sessions.map((s) => this.mapToDto(s));
  }

  // === FIND ONE ===
  async findOne(id: number): Promise<ResponseClassSessionDto> {
    const res = new ResponseClassSessionDto();
    const session = await this.sessionRepository.findById(id);

    if (!session) {
      res.pushError({ key: 'id', value: `Buổi học ID ${id} không tồn tại.` });
      return res;
    }
    res.session = this.mapToDto(session);
    return res;
  }

  // =========================================================================
  //                                ACTIONS
  // =========================================================================

  /**
   * 1. START SESSION
   * Logic: Chỉ chuyển trạng thái sang ONGOING. KHÔNG tạo điểm danh.
   */
  async startSession(sessionId: number, openerId: number): Promise<ResponseClassSessionDto> {
    const res = new ResponseClassSessionDto();

    // Kiểm tra tồn tại
    const session = await this.sessionRepository.findById(sessionId);
    if (!session) {
      res.pushError({ key: 'id', value: `Buổi học ID ${sessionId} không tồn tại.` });
      return res;
    }

    // Logic: Nếu đã kết thúc thì không start lại (Tùy chọn)
    if (session.status === SessionStatus.FINISHED) {
      res.pushError({ key: 'status', value: 'Buổi học đã kết thúc.' });
      return res;
    }

    try {
      // Gọi Repo để update status = ONGOING
      const updatedSession = await this.sessionRepository.startSession(sessionId, openerId);
      res.session = this.mapToDto(updatedSession);
    } catch (error) {
      console.error('Start Session Error:', error);
      res.pushError({ key: 'global', value: 'Lỗi khi bắt đầu buổi học.' });
    }

    return res;
  }

  /**
   * 2. OPEN ATTENDANCE (MỞ ĐIỂM DANH)
   * Logic: 
   * - Check session phải đang ONGOING.
   * - Sinh mã OTP.
   * - Lấy danh sách SV.
   * - Gọi Repo để lưu mã, mở cờ, và tạo record ABSENT.
   */
  async openAttendance(sessionId: number, teacherId: number): Promise<ResponseClassSessionDto> {
    const res = new ResponseClassSessionDto();

    const session = await this.sessionRepository.findById(sessionId);
    if (!session) {
      res.pushError({ key: 'id', value: 'Buổi học không tồn tại.' });
      return res;
    }

    // [QUAN TRỌNG]: Phải Start Session trước mới được Mở điểm danh
    if (session.status !== SessionStatus.ONGOING) {
      res.pushError({ key: 'logic', value: 'Vui lòng Bắt đầu lớp học trước khi mở điểm danh.' });
      return res;
    }

    // 1. Sinh mã OTP (6 số ngẫu nhiên)
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

    // 2. Lấy danh sách học sinh
    const studentIds = await this.enrollmentRepository.getStudentIdsByClass(session.classId);

    try {
      // 3. Gọi Repo xử lý Transaction
      const updatedSession = await this.sessionRepository.openAttendance(
        sessionId,
        studentIds,
        otpCode
      );
      res.session = this.mapToDto(updatedSession);
    } catch (error) {
      console.error('Open Attendance Error:', error);
      res.pushError({ key: 'global', value: 'Lỗi khi mở điểm danh.' });
    }

    return res;
  }

  /**
   * 3. CLOSE ATTENDANCE
   * Logic: Chỉ tắt cờ isAttendanceOpen.
   */
  async closeAttendance(sessionId: number): Promise<ResponseClassSessionDto> {
    const res = new ResponseClassSessionDto();
    try {
      const updatedSession = await this.sessionRepository.closeAttendance(sessionId);
      res.session = this.mapToDto(updatedSession);
    } catch (error) {
      res.pushError({ key: 'global', value: 'Lỗi khi đóng điểm danh.' });
    }
    return res;
  }

  /**
   * 4. FINISH SESSION
   * Logic: Kết thúc buổi học, đảm bảo đóng luôn điểm danh.
   */
  async finishSession(sessionId: number): Promise<ResponseClassSessionDto> {
    const res = new ResponseClassSessionDto();
    try {
      const updatedSession = await this.sessionRepository.finishSession(sessionId);
      res.session = this.mapToDto(updatedSession);
    } catch (error) {
      res.pushError({ key: 'global', value: 'Lỗi khi kết thúc buổi học.' });
    }
    return res;
  }

  // === UPDATE (Manual) ===
  async update(id: number, dto: UpdateClassSessionDto): Promise<ResponseClassSessionDto> {
    const res = new ResponseClassSessionDto();
    try {
      const updated = await this.sessionRepository.update(id, dto);
      res.session = this.mapToDto(updated);
    } catch (error) {
      res.pushError({ key: 'global', value: 'Lỗi cập nhật buổi học.' });
    }
    return res;
  }

  // =========================================================================
  //                                MAPPER
  // =========================================================================

  private mapToDto(data: ClassSession): ClassSessionDto {
    return {
      id: data.id,
      classId: data.classId,
      sessionNumber: data.sessionNumber,
      date: data.date,
      startTime: data.startTime,
      endTime: data.endTime,
      title: data.title,
      description: data.description,
      status: data.status,
      
      // [QUAN TRỌNG] Trả về 2 trường này để Mobile xử lý QR
      isAttendanceOpen: data.isAttendanceOpen,
      attendanceCode: data.attendanceCode, 
      
      openedBy: data.openedBy,
    };
  }
}