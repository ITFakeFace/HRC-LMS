import { Injectable, NotFoundException } from '@nestjs/common';
import { Class, ClassStatus, Prisma } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class ClassRepository {
  constructor(private prisma: PrismaService) {}

  async create(data: Prisma.ClassUncheckedCreateInput): Promise<Class> {
    return this.prisma.class.create({ data });
  }

  async findAll(courseId?: number): Promise<Class[]> {
    const where: Prisma.ClassWhereInput = courseId ? { courseId } : {};
    
    return this.prisma.class.findMany({
      where,
      include: {
        course: { select: { name: true, code: true } },
        _count: { select: { enrollments: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(id: number): Promise<Class | null> {
    return this.prisma.class.findUnique({
      where: { id },
      include: {
        course: true,
        enrollments: {
          include: {
            student: {
              select: { id: true, fullname: true, pID: true, email: true },
            },
          },
        },
      },
    });
  }

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

  async delete(id: number): Promise<Class> {
    try {
      return await this.prisma.class.delete({
        where: { id },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        throw new NotFoundException(`Class with ID ${id} not found.`);
      }
      throw error;
    }
  }
}