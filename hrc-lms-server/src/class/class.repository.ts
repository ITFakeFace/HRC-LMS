import { Injectable } from '@nestjs/common';
import { Prisma, Class, ClassStatus } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { ScheduleUtils } from 'src/utils/schedule.utils';

@Injectable()
export class ClassRepository {
  constructor(private prisma: PrismaService) {}

  // --- CREATE ---
  
  // Tạo lớp và tự động sinh ClassSession dựa trên cấu hình (Shift, StartDate...)
  async createWithSchedule(data: Prisma.ClassUncheckedCreateInput): Promise<Class> {
    const { startDate, totalSessions, shift, startTime, endTime } = data;

    // 1. Sinh mảng sessions từ Utils
    const sessionsData = ScheduleUtils.generateSessions(
      new Date(startDate),
      totalSessions || 0,
      shift,
      startTime,
      endTime
    );

    // 2. Insert Lớp + Sessions cùng lúc
    return this.prisma.class.create({
      data: {
        ...data,
        sessions: {
          create: sessionsData, 
        },
      },
      include: {
        sessions: true, // Trả về để kiểm tra
      },
    });
  }

  async create(data: Prisma.ClassUncheckedCreateInput): Promise<Class> {
    return this.prisma.class.create({ data });
  }

  // --- READ ---

  async findAll(courseId?: number, lecturerId?: number): Promise<Class[]> {
    const where: Prisma.ClassWhereInput = {};
    if (courseId) where.courseId = courseId;
    if (lecturerId) where.lecturerId = lecturerId;

    return this.prisma.class.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        course: { select: { name: true, code: true } },
        _count: { select: { enrollments: true } },
      },
    });
  }

  async findById(id: number): Promise<Class | null> {
    return this.prisma.class.findUnique({
      where: { id },
      include: {
        course: true,
        lecturer: { select: { id: true, fullname: true, email: true } },
        sessions: { orderBy: { sessionNumber: 'asc' } }, // Lấy kèm lịch học
        _count: { select: { enrollments: true } },
      },
    });
  }

  // --- UPDATE ---

  async update(id: number, data: Prisma.ClassUpdateInput): Promise<Class> {
    return this.prisma.class.update({
      where: { id },
      data,
    });
  }

  async updateStatus(id: number, status: ClassStatus): Promise<Class> {
    return this.prisma.class.update({
      where: { id },
      data: { status },
    });
  }

  // --- DELETE ---

  async delete(id: number): Promise<Class> {
    return this.prisma.class.delete({
      where: { id },
    });
  }
}