import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { Prisma, FormRequest, RequestStatus } from '@prisma/client';

@Injectable()
export class FormRequestsRepository {
  constructor(private readonly prisma: PrismaService) {}

  // 1. TẠO YÊU CẦU MỚI
  async create(data: Prisma.FormRequestCreateInput): Promise<FormRequest> {
    return this.prisma.formRequest.create({
      data,
    });
  }

  // 2. LẤY DANH SÁCH (Hỗ trợ Pagination, Filter Status, Search)
  async findAll(params: {
    skip?: number;
    take?: number;
    cursor?: Prisma.FormRequestWhereUniqueInput;
    where?: Prisma.FormRequestWhereInput;
    orderBy?: Prisma.FormRequestOrderByWithRelationInput;
  }): Promise<FormRequest[]> {
    const { skip, take, cursor, where, orderBy } = params;
    return this.prisma.formRequest.findMany({
      skip,
      take,
      cursor,
      where,
      orderBy: orderBy || { createdAt: 'desc' }, // Mặc định mới nhất lên đầu
      include: {
        user: { // Kèm thông tin người gửi để Admin biết ai xin
          select: { id: true, fullname: true, email: true, username: true, avatar: true },
        },
      },
    });
  }

  // 3. LẤY CHI TIẾT
  async findById(id: number): Promise<FormRequest | null> {
    return this.prisma.formRequest.findUnique({
      where: { id },
      include: {
        user: {
            select: { id: true, fullname: true, email: true, phone: true },
        },
      },
    });
  }

  // 4. CẬP NHẬT (Dùng cho Admin duyệt/từ chối hoặc User sửa nội dung)
  async update(id: number, data: Prisma.FormRequestUpdateInput): Promise<FormRequest> {
    return this.prisma.formRequest.update({
      where: { id },
      data,
    });
  }

  // 5. XÓA
  async delete(id: number): Promise<FormRequest> {
    return this.prisma.formRequest.delete({
      where: { id },
    });
  }

  // --- TÍNH NĂNG THÊM ---

  // 6. ĐẾM SỐ LƯỢNG (Dùng cho Phân trang)
  async count(where?: Prisma.FormRequestWhereInput): Promise<number> {
    return this.prisma.formRequest.count({ where });
  }

  // 7. THỐNG KÊ THEO TRẠNG THÁI (Dashboard Admin)
  async countByStatus() {
    const group = await this.prisma.formRequest.groupBy({
      by: ['status'],
      _count: {
        id: true,
      },
    });
    // Format lại cho dễ dùng: { PENDING: 5, RESOLVED: 10 }
    return group.reduce((acc, curr) => {
        acc[curr.status] = curr._count.id;
        return acc;
    }, {} as Record<string, number>);
  }
}