// src/attendance/attendance.repository.ts
import { Injectable } from '@nestjs/common';
import { Prisma, AttendanceRecord, AttendanceStatus } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class AttendanceRecordRepository {
  constructor(private prisma: PrismaService) {}

  // --- UPDATE ---
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

  async updateManual(sessionId: number, studentId: number, status: AttendanceStatus, note?: string) {
    return this.prisma.attendanceRecord.update({
      where: { sessionId_stdId: { sessionId, stdId: studentId } },
      data: { status, note },
    });
  }

  // --- READ ---
  // Helper: Lấy thông tin Session để validate mã QR
  async getSessionAuthInfo(sessionId: number) {
    return this.prisma.classSession.findUnique({
      where: { id: sessionId },
      select: { 
        id: true, 
        isAttendanceOpen: true, 
        attendanceCode: true, 
        status: true 
      }
    });
  }

  async findByStudentInClass(studentId: number, classId: number) {
    return this.prisma.attendanceRecord.findMany({
      where: { stdId: studentId, session: { classId } },
      include: { session: true },
      orderBy: { session: { sessionNumber: 'asc' } },
    });
  }

  // --- 🆕 STATISTICS (THỐNG KÊ CHO GIÁO VIÊN) ---
  async getSessionStatistics(sessionId: number) {
    // Group by status để đếm
    const stats = await this.prisma.attendanceRecord.groupBy({
      by: ['status'],
      where: { sessionId },
      _count: {
        status: true,
      },
    });
    
    // Đếm tổng số record (Sĩ số thực tế trong buổi học đó)
    const total = await this.prisma.attendanceRecord.count({
      where: { sessionId },
    });

    return { stats, total };
  }

  async findAllBySession(sessionId: number): Promise<AttendanceRecord[]> {
    return this.prisma.attendanceRecord.findMany({
      where: { sessionId },
      include: {
        student: { // Include bảng Student (User)
          select: { id: true, fullname: true, pID: true, email: true, dob: true }, 
        }
      },
      orderBy: {
        student: { fullname: 'asc' } // Sắp xếp theo tên A-Z
      }
    });
  }
}