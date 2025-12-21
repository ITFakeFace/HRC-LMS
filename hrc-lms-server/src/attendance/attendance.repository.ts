import { Injectable, NotFoundException } from '@nestjs/common';
import {
  AttendanceSession,
  AttendanceRecord,
  Prisma,
  AttendanceStatus,
} from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class AttendanceRepository {
  constructor(private prisma: PrismaService) {}

  // ===================== SESSION =====================

  /**
   * Transaction: Tạo Session -> Tạo hàng loạt Record ABSENT
   */
  async createSessionWithRecords(
    classId: number,
    teacherId: number,
    studentIds: number[],
  ): Promise<AttendanceSession> {
    return this.prisma.$transaction(async (tx) => {
      // 1. Tạo Session
      const session = await tx.attendanceSession.create({
        data: {
          classId,
          openBy: teacherId,
          openAt: new Date(),
          closeAt: null,
        },
      });

      // 2. Chuẩn bị data records
      if (studentIds.length > 0) {
        const recordsData = studentIds.map((stdId) => ({
          sessionId: session.id,
          stdId: stdId,
          status: AttendanceStatus.ABSENT,
        }));

        // 3. Insert hàng loạt
        await tx.attendanceRecord.createMany({
          data: recordsData,
        });
      }

      return session;
    });
  }

  async findSessionById(id: number): Promise<AttendanceSession | null> {
    return this.prisma.attendanceSession.findUnique({
      where: { id },
      include: {
        opener: { select: { fullname: true } },
        records: {
          include: {
            student: { select: { id: true, fullname: true, pID: true } },
          },
          orderBy: { student: { pID: 'asc' } },
        },
      },
    });
  }

  async findSessionsByClass(classId: number): Promise<AttendanceSession[]> {
    return this.prisma.attendanceSession.findMany({
      where: { classId },
      orderBy: { openAt: 'desc' },
      include: {
        _count: { select: { records: true } },
      },
    });
  }

  async closeSession(id: number): Promise<AttendanceSession> {
    return this.prisma.attendanceSession.update({
      where: { id },
      data: { closeAt: new Date() },
    });
  }

  // ===================== RECORD =====================

  async updateRecord(
    sessionId: number,
    studentId: number,
    status: AttendanceStatus,
    note?: string,
  ): Promise<AttendanceRecord> {
    return this.prisma.attendanceRecord.update({
      where: {
        sessionId_stdId: {
          sessionId,
          stdId: studentId,
        },
      },
      data: {
        status,
        note,
      },
    });
  }

  async getStudentRecordsInClass(
    studentId: number,
    classId: number,
  ): Promise<AttendanceRecord[]> {
    return this.prisma.attendanceRecord.findMany({
      where: {
        stdId: studentId,
        session: {
          classId: classId,
        },
      },
      include: {
        session: true,
      },
    });
  }
}