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

  // === START SESSION (QUAN TRỌNG) ===
  async startSession(sessionId: number, openerId: number): Promise<ResponseClassSessionDto> {
    const res = new ResponseClassSessionDto();

    // 1. Lấy thông tin session để biết classId
    const session = await this.sessionRepository.findById(sessionId);
    if (!session) {
      res.pushError({ key: 'id', value: `Buổi học ID ${sessionId} không tồn tại.` });
      return res;
    }

    // 2. Lấy danh sách học sinh đang học trong lớp
    const studentIds = await this.enrollmentRepository.getStudentIdsByClass(session.classId);

    // 3. Gọi Repo để Start và Init Attendance
    try {
      const updatedSession = await this.sessionRepository.startSession(
        sessionId,
        openerId,
        studentIds,
      );
      res.session = this.mapToDto(updatedSession);
    } catch (error) {
      console.error('Start Session Error:', error);
      res.pushError({ key: 'global', value: 'Lỗi khi bắt đầu buổi học.' });
    }

    return res;
  }

  // === FINISH SESSION ===
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
      isAttendanceOpen: data.isAttendanceOpen,
      openedBy: data.openedBy,
    };
  }
}