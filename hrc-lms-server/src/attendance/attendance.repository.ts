import { Injectable } from '@nestjs/common';
import { Prisma, AttendanceRecord, AttendanceStatus } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class AttendanceRecordRepository {
  constructor(private prisma: PrismaService) {}

  // --- UPDATE (CHECK-IN) ---

  // Sinh viên tự điểm danh (Quét QR)
  async checkIn(sessionId: number, studentId: number): Promise<AttendanceRecord> {
    return this.prisma.attendanceRecord.update({
      where: {
        sessionId_stdId: { sessionId, stdId: studentId },
      },
      data: {
        status: AttendanceStatus.PRESENT,
        checkInAt: new Date(),
      },
    });
  }

  // Giáo viên cập nhật thủ công (VD: Sửa từ Vắng thành Có phép)
  async updateManual(
    sessionId: number,
    studentId: number,
    status: AttendanceStatus,
    note?: string
  ): Promise<AttendanceRecord> {
    return this.prisma.attendanceRecord.update({
      where: {
        sessionId_stdId: { sessionId, stdId: studentId },
      },
      data: { status, note },
    });
  }

  // --- READ ---

  // Lấy lịch sử điểm danh của 1 sinh viên trong 1 lớp (Tính % chuyên cần)
  async findByStudentInClass(studentId: number, classId: number): Promise<AttendanceRecord[]> {
    return this.prisma.attendanceRecord.findMany({
      where: {
        stdId: studentId,
        session: { classId },
      },
      include: {
        session: true, // Lấy ngày giờ buổi học
      },
      orderBy: { session: { sessionNumber: 'asc' } },
    });
  }
}