import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { Prisma, ErrorReport, RequestStatus } from '@prisma/client';

@Injectable()
export class ErrorReportsRepository {
  constructor(private readonly prisma: PrismaService) {}

  // 1. TẠO BÁO LỖI
  async create(data: Prisma.ErrorReportCreateInput): Promise<ErrorReport> {
    return this.prisma.errorReport.create({
      data,
    });
  }

  // 2. LẤY DANH SÁCH BÁO LỖI
  async findAll(params: {
    skip?: number;
    take?: number;
    where?: Prisma.ErrorReportWhereInput;
    orderBy?: Prisma.ErrorReportOrderByWithRelationInput;
  }): Promise<ErrorReport[]> {
    const { skip, take, where, orderBy } = params;
    return this.prisma.errorReport.findMany({
      skip,
      take,
      where,
      orderBy: orderBy || { createdAt: 'desc' },
      include: {
        user: { // Admin cần biết user nào gặp lỗi để liên hệ
          select: { id: true, fullname: true, email: true, phone: true, username: true },
        },
      },
    });
  }

  // 3. LẤY CHI TIẾT
  async findById(id: number): Promise<ErrorReport | null> {
    return this.prisma.errorReport.findUnique({
      where: { id },
      include: {
        user: true, 
      },
    });
  }

  // 4. CẬP NHẬT TRẠNG THÁI / PHẢN HỒI
  async update(id: number, data: Prisma.ErrorReportUpdateInput): Promise<ErrorReport> {
    return this.prisma.errorReport.update({
      where: { id },
      data,
    });
  }

  // 5. XÓA
  async delete(id: number): Promise<ErrorReport> {
    return this.prisma.errorReport.delete({
      where: { id },
    });
  }

  // --- TÍNH NĂNG THÊM ---

  // 6. KIỂM TRA LỖI TRÙNG LẶP (Dựa trên tiêu đề tương tự trong 24h qua)
  // Tính năng này giúp Admin không bị spam bởi cùng 1 lỗi
  async findSimilarReports(titleSnippet: string): Promise<ErrorReport[]> {
    return this.prisma.errorReport.findMany({
        where: {
            title: {
                contains: titleSnippet, // Tìm gần đúng
            },
            createdAt: {
                gte: new Date(new Date().setDate(new Date().getDate() - 1)) // Trong 24h qua
            }
        }
    })
  }
}