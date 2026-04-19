import { Injectable } from '@nestjs/common';
import { Category } from '@prisma/client'; // Import Model gốc từ Prisma
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class CategoriesRepository {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Tạo mới category
   * Trả về: Model gốc (Category)
   */
  async create(data: CreateCategoryDto): Promise<Category> {
    return this.prisma.category.create({
      data,
    });
  }

  /**
   * Lấy danh sách tất cả
   * Trả về: Mảng Model gốc (Category[])
   */
  async findAll(): Promise<Category[]> {
    return this.prisma.category.findMany();
  }

  /**
   * Tìm theo ID
   * Trả về: Model gốc hoặc null
   */
  async findById(id: number): Promise<Category | null> {
    return this.prisma.category.findUnique({
      where: { id },
    });
  }

  /**
   * Tìm theo Tên (hữu ích để check unique)
   */
  async findByName(name: string): Promise<Category | null> {
    return this.prisma.category.findUnique({
      where: { name },
    });
  }

  /**
   * Cập nhật
   * Lưu ý: Prisma sẽ throw error nếu ID không tồn tại
   */
  async update(id: number, data: UpdateCategoryDto): Promise<Category> {
    return this.prisma.category.update({
      where: { id },
      data,
    });
  }

  /**
   * Xóa
   */
  async delete(id: number): Promise<Category> {
    return this.prisma.category.delete({
      where: { id },
    });
  }
}