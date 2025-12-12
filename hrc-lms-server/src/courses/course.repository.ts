import { Injectable } from '@nestjs/common';
import { Course, Prisma } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class CoursesRepository {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Tạo mới Course
   * Lưu ý: data ở đây là Prisma Input (đã được xử lý relations connect ở Service)
   */
  async create(data: Prisma.CourseCreateInput): Promise<Course> {
    return this.prisma.course.create({
      data,
      include: {
        categories: true, // Trả về luôn categories để hiển thị nếu cần
        creator: true,    // Trả về thông tin người tạo (tùy chọn)
      },
    });
  }

  /**
   * Lấy danh sách tất cả
   */
  async findAll(): Promise<Course[]> {
    return this.prisma.course.findMany({
      include: {
        categories: true, // Eager loading categories
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  /**
   * Tìm theo ID
   */
  async findById(id: number): Promise<Course | null> {
    return this.prisma.course.findUnique({
      where: { id },
      include: {
        categories: true,
        creator: true,
      },
    });
  }

  /**
   * Tìm theo Code (Mã khóa học) - Dùng để check trùng hoặc tìm kiếm nhanh
   */
  async findByCode(code: string): Promise<Course | null> {
    return this.prisma.course.findUnique({
      where: { code },
    });
  }

  /**
   * Tìm theo Slug - Dùng cho Public API (SEO friendly)
   */
  async findBySlug(slug: string): Promise<Course | null> {
    return this.prisma.course.findUnique({
      where: { slug },
      include: {
        categories: true,
      },
    });
  }

  /**
   * Cập nhật
   */
  async update(id: number, data: Prisma.CourseUpdateInput): Promise<Course> {
    return this.prisma.course.update({
      where: { id },
      data,
      include: {
        categories: true,
      },
    });
  }

  /**
   * Xóa
   */
  async delete(id: number): Promise<Course> {
    return this.prisma.course.delete({
      where: { id },
    });
  }
  
  /**
   * Search nâng cao (Optional)
   * Tìm kiếm theo tên hoặc code
   */
  async search(keyword: string): Promise<Course[]> {
    return this.prisma.course.findMany({
      where: {
        OR: [
          { name: { contains: keyword } }, // MySQL mặc định case-insensitive với collation chuẩn
          { code: { contains: keyword } },
        ],
      },
      include: { categories: true },
    });
  }
}