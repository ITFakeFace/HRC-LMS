import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { ConsultationBooking, Prisma } from '@prisma/client';

@Injectable()
export class ConsultationBookingRepository {
  constructor(private readonly prisma: PrismaService) {}

  // 1. TẠO LỊCH HẸN
  async create(
    data: Prisma.ConsultationBookingCreateInput,
  ): Promise<ConsultationBooking> {
    return this.prisma.consultationBooking.create({ data });
  }

  // 2. TÌM 1 LỊCH HẸN (Theo ID)
  async findUnique(id: number): Promise<ConsultationBooking | null> {
    return this.prisma.consultationBooking.findUnique({
      where: { id },
    });
  }

  // 3. TÌM THEO THỜI GIAN (Dùng để check trùng giờ)
  // Logic: Tìm xem có lịch nào trùng giờ này mà chưa bị hủy không
  async findByTime(time: Date): Promise<ConsultationBooking | null> {
    return this.prisma.consultationBooking.findFirst({
      where: {
        time: time,
        status: { not: 'CANCELLED' }, // Không tính các đơn đã hủy
      },
    });
  }

  // 4. TÌM NHIỀU (Phân trang, Lọc, Sắp xếp) - Generic Style giống SessionRepo
  async findMany(params: {
    skip?: number;
    take?: number;
    where?: Prisma.ConsultationBookingWhereInput;
    orderBy?: Prisma.ConsultationBookingOrderByWithRelationInput;
  }): Promise<ConsultationBooking[]> {
    const { skip, take, where, orderBy } = params;
    return this.prisma.consultationBooking.findMany({
      skip,
      take,
      where,
      orderBy: orderBy || { createdAt: 'desc' }, // Mặc định mới nhất lên đầu
    });
  }

  // 5. CẬP NHẬT (Trạng thái, Ghi chú, Dời lịch...)
  async update(
    id: number,
    data: Prisma.ConsultationBookingUpdateInput,
  ): Promise<ConsultationBooking> {
    return this.prisma.consultationBooking.update({
      where: { id },
      data,
    });
  }

  // 6. XÓA LỊCH HẸN
  async delete(id: number): Promise<ConsultationBooking> {
    return this.prisma.consultationBooking.delete({
      where: { id },
    });
  }

  // 7. ĐẾM (Dùng cho phân trang)
  async count(where?: Prisma.ConsultationBookingWhereInput): Promise<number> {
    return this.prisma.consultationBooking.count({ where });
  }
}
