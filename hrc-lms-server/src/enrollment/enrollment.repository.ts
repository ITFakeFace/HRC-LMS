import { Injectable, NotFoundException } from '@nestjs/common';
import { Enrollment, Prisma, EnrollmentStatus } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class EnrollmentRepository {
  constructor(private prisma: PrismaService) {}

  // Dùng UncheckedCreateInput để truyền thẳng ID (studentId, classId)
  async create(data: Prisma.EnrollmentUncheckedCreateInput): Promise<Enrollment> {
    return this.prisma.enrollment.create({ data });
  }

  async findByStudentAndClass(studentId: number, classId: number): Promise<Enrollment | null> {
    return this.prisma.enrollment.findUnique({
      where: {
        studentId_classId: {
          studentId,
          classId,
        },
      },
    });
  }

  // Lấy danh sách ID học sinh đang học (Status = LEARNING)
  async getStudentIdsByClass(classId: number): Promise<number[]> {
    const enrollments = await this.prisma.enrollment.findMany({
      where: {
        classId,
        status: EnrollmentStatus.LEARNING,
      },
      select: { studentId: true },
    });
    return enrollments.map((e) => e.studentId);
  }

  async findByStudent(studentId: number): Promise<Enrollment[]> {
    return this.prisma.enrollment.findMany({
      where: { studentId },
      include: {
        class: {
          include: { course: true },
        },
      },
    });
  }

  async updateStatus(id: number, status: EnrollmentStatus): Promise<Enrollment> {
    return this.prisma.enrollment.update({
      where: { id },
      data: { status },
    });
  }

  async delete(id: number): Promise<Enrollment> {
    try {
      return await this.prisma.enrollment.delete({
        where: { id },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        throw new NotFoundException(`Enrollment with ID ${id} not found.`);
      }
      throw error;
    }
  }
  
  async getMySchedule(studentId: number, fromDate: Date, toDate: Date) {
    return this.prisma.classSession.findMany({
      where: {
        // 1. Lọc theo ngày
        date: { gte: fromDate, lte: toDate },
        // 2. Lọc theo lớp mà user đang học
        class: {
          enrollments: {
            some: {
              studentId: studentId,
              status: EnrollmentStatus.LEARNING,
            },
          },
        },
      },
      include: {
        class: { select: { name: true, code: true } },
        // 3. Kèm theo trạng thái điểm danh của chính user trong buổi đó
        records: {
          where: { stdId: studentId },
          select: { status: true, checkInAt: true },
        },
      },
      orderBy: { date: 'asc' }, // Sắp xếp từ gần tới xa
    });
  }
}