import { Injectable } from '@nestjs/common';
import { Prisma, ClassSession, SessionStatus, AttendanceStatus } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class ClassSessionRepository {
  constructor(private prisma: PrismaService) {}

  // =========================================================================
  //                                READ
  // =========================================================================

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

  // Lấy chi tiết 1 buổi học
  async findById(id: number): Promise<ClassSession | null> {
    return this.prisma.classSession.findUnique({
      where: { id },
      include: {
        class: { select: { name: true, code: true, lecturerId: true, lecturer:true } }, // Lấy thêm lecturerId để check quyền
        records: {
          include: { student: { select: { id: true, fullname: true, pID: true } } },
          orderBy: { student: { pID: 'asc' } },
        },
      },
    });
  }

  // =========================================================================
  //                                WRITE
  // =========================================================================

  /**
   * 1. BẮT ĐẦU BUỔI HỌC (Start Session)
   * - Chỉ chuyển trạng thái sang ONGOING.
   * - Lưu người mở và thời gian bắt đầu thực tế.
   * - KHÔNG tạo record điểm danh ở bước này.
   */
  async startSession(sessionId: number, openerId: number): Promise<ClassSession> {
    return this.prisma.classSession.update({
      where: { id: sessionId },
      data: {
        status: SessionStatus.ONGOING,
        openedBy: openerId,
        startTime: new Date(), // Lưu thời gian bắt đầu thực tế (Real-time)
        // isAttendanceOpen mặc định là false hoặc giữ nguyên, không đụng vào
      },
    });
  }

  /**
   * 2. MỞ ĐIỂM DANH (Open Attendance)
   * - Update cờ isAttendanceOpen = true.
   * - Lưu mã OTP (attendanceCode).
   * - Transaction: Tạo luôn bản ghi điểm danh (ABSENT) cho toàn bộ sinh viên.
   */
  async openAttendance(
    sessionId: number, 
    studentIds: number[], 
    code: string
  ): Promise<ClassSession> {
    return this.prisma.$transaction(async (tx) => {
      // B1: Update Session
      const session = await tx.classSession.update({
        where: { id: sessionId },
        data: {
          isAttendanceOpen: true,
          attendanceCode: code,
        },
      });

      // B2: Tạo Attendance Records (Mặc định là ABSENT - Vắng)
      // Dùng skipDuplicates: true để an toàn: 
      // Nếu giáo viên Tắt rồi Mở lại điểm danh -> Không bị lỗi trùng, không reset trạng thái của ai đã điểm danh rồi.
      if (studentIds.length > 0) {
        await tx.attendanceRecord.createMany({
          data: studentIds.map((stdId) => ({
            sessionId: sessionId,
            stdId: stdId,
            status: AttendanceStatus.ABSENT, // Mặc định vắng
          })),
          skipDuplicates: true, 
        });
      }

      return session;
    });
  }

  /**
   * 3. ĐÓNG ĐIỂM DANH (Close Attendance)
   * - Chỉ tắt cờ isAttendanceOpen.
   * - Giữ nguyên mã Code (để tra cứu nếu cần) hoặc xóa đi tùy logic (ở đây giữ nguyên).
   */
  async closeAttendance(sessionId: number): Promise<ClassSession> {
    return this.prisma.classSession.update({
      where: { id: sessionId },
      data: {
        isAttendanceOpen: false,
      },
    });
  }

  /**
   * 4. KẾT THÚC BUỔI HỌC (Finish Session)
   * - Chuyển status sang FINISHED.
   * - Đảm bảo đóng điểm danh (isAttendanceOpen = false).
   * - Lưu thời gian kết thúc thực tế.
   */
  async finishSession(id: number): Promise<ClassSession> {
    return this.prisma.classSession.update({
      where: { id },
      data: {
        status: SessionStatus.FINISHED,
        isAttendanceOpen: false,
        endTime: new Date(), // Lưu thời gian kết thúc
      },
    });
  }

  // Update thông tin thủ công (đổi phòng, đổi note...)
  async update(id: number, data: Prisma.ClassSessionUpdateInput): Promise<ClassSession> {
    return this.prisma.classSession.update({
      where: { id },
      data,
    });
  }

  // Xóa buổi học (chỉ dùng khi admin dọn dẹp data rác)
  async delete(id: number): Promise<ClassSession> {
    return this.prisma.classSession.delete({ where: { id } });
  }
}