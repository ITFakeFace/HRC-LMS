import { Injectable } from '@nestjs/common';
import { Prisma, ClassSession, SessionStatus, AttendanceStatus } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class ClassSessionRepository {
  constructor(private prisma: PrismaService) {}

  // --- READ ---

  // Lấy lịch học của 1 lớp
  async findByClass(classId: number): Promise<ClassSession[]> {
    return this.prisma.classSession.findMany({
      where: { classId },
      orderBy: { sessionNumber: 'asc' },
      include: {
        _count: { select: { records: true } }, // Đếm xem bao nhiêu người đã có bản ghi điểm danh
      },
    });
  }

  async findById(id: number): Promise<ClassSession | null> {
    return this.prisma.classSession.findUnique({
      where: { id },
      include: {
        class: { select: { name: true, code: true } },
        records: {
          include: { student: { select: { id: true, fullname: true, pID: true } } },
          orderBy: { student: { pID: 'asc' } },
        },
      },
    });
  }

  // --- UPDATE (Start/Finish Session) ---

  /**
   * BẮT ĐẦU BUỔI HỌC (Mở điểm danh)
   * Transaction: Update Session -> Tạo AttendanceRecord cho toàn bộ sinh viên (status=ABSENT)
   */
  async startSession(
    sessionId: number,
    openerId: number,
    studentIds: number[]
  ): Promise<ClassSession> {
    return this.prisma.$transaction(async (tx) => {
      // 1. Cập nhật trạng thái buổi học
      const session = await tx.classSession.update({
        where: { id: sessionId },
        data: {
          status: SessionStatus.ONGOING,
          isAttendanceOpen: true,
          openedBy: openerId,
        },
      });

      // 2. Tạo bản ghi điểm danh (Lazy Init)
      // Chỉ tạo nếu chưa có (tránh lỗi duplicate nếu giáo viên bấm Start 2 lần)
      const existingCount = await tx.attendanceRecord.count({ where: { sessionId } });
      
      if (existingCount === 0 && studentIds.length > 0) {
        await tx.attendanceRecord.createMany({
          data: studentIds.map((stdId) => ({
            sessionId: sessionId,
            stdId: stdId,
            status: AttendanceStatus.ABSENT, // Mặc định vắng
          })),
        });
      }

      return session;
    });
  }

  // Kết thúc buổi học
  async finishSession(id: number): Promise<ClassSession> {
    return this.prisma.classSession.update({
      where: { id },
      data: {
        status: SessionStatus.FINISHED,
        isAttendanceOpen: false,
      },
    });
  }

  // Update thông tin buổi học (đổi phòng, đổi giờ, note...)
  async update(id: number, data: Prisma.ClassSessionUpdateInput): Promise<ClassSession> {
    return this.prisma.classSession.update({
      where: { id },
      data,
    });
  }

  // --- DELETE ---
  async delete(id: number): Promise<ClassSession> {
    return this.prisma.classSession.delete({ where: { id } });
  }
}