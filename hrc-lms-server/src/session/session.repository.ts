import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ClientSession, Prisma } from '@prisma/client';

@Injectable()
export class SessionRepository {
  constructor(private prisma: PrismaService) {}

  // 1. TẠO SESSION
  // Input tự động khớp với schema (bao gồm cả bookingState nếu có)
  async create(data: Prisma.ClientSessionCreateInput): Promise<ClientSession> {
    return this.prisma.clientSession.create({ data });
  }

  // 2. TÌM 1 SESSION (Theo ID)
  async findUnique(
    id: number,
    include?: Prisma.ClientSessionInclude,
  ): Promise<ClientSession | null> {
    return this.prisma.clientSession.findUnique({
      where: { id },
      include, // Thường dùng để include { messages: true }
    });
  }

  // 3. TÌM NHIỀU (Phân trang, Lọc)
  async findMany(params: {
    skip?: number;
    take?: number;
    where?: Prisma.ClientSessionWhereInput;
    orderBy?: Prisma.ClientSessionOrderByWithRelationInput;
    include?: Prisma.ClientSessionInclude;
  }): Promise<ClientSession[]> {
    const { skip, take, where, orderBy, include } = params;
    return this.prisma.clientSession.findMany({
      skip,
      take,
      where,
      orderBy: orderBy || { createdAt: 'desc' },
      include,
    });
  }

  // 4. TÌM SESSION ĐANG HOẠT ĐỘNG CỦA USER
  // (Dùng để resume hội thoại khi user F5 hoặc đổi thiết bị)
  async findActiveByUserId(userId: number): Promise<ClientSession | null> {
    return this.prisma.clientSession.findFirst({
      where: {
        userId,
        isEnded: false, // Chỉ lấy phiên chưa kết thúc
      },
      orderBy: { createdAt: 'desc' }, // Lấy cái mới nhất
    });
  }

  // 5. LINK USER VÀO SESSION (Khi khách đăng nhập)
  async linkUserToSession(
    sessionId: number,
    userId: number,
  ): Promise<ClientSession> {
    return this.prisma.clientSession.update({
      where: { id: sessionId },
      data: { userId },
    });
  }

  // 6. [QUAN TRỌNG] CẬP NHẬT TRẠNG THÁI ĐẶT LỊCH (JSON)
  // Hàm này được gọi liên tục mỗi khi AI trích xuất được thông tin mới
  async updateBookingState(id: number, newState: any): Promise<ClientSession> {
    // Logic:
    // - Nếu newState là null -> Gán Prisma.DbNull để xóa dữ liệu trong DB (SQL NULL)
    // - Nếu newState là object -> Lưu đè vào

    const dataToUpdate =
      newState === null ? Prisma.DbNull : (newState as Prisma.InputJsonValue);

    return this.prisma.clientSession.update({
      where: { id },
      data: {
        bookingState: dataToUpdate,
      },
    });
  }

  // 7. CẬP NHẬT THÔNG TIN CHUNG (AIEnable, isEnded...)
  async update(
    id: number,
    data: Prisma.ClientSessionUpdateInput,
  ): Promise<ClientSession> {
    return this.prisma.clientSession.update({
      where: { id },
      data,
    });
  }

  // 8. XÓA SESSION
  async delete(id: number): Promise<ClientSession> {
    return this.prisma.clientSession.delete({
      where: { id },
    });
  }

  // 9. ĐẾM (Dùng cho phân trang)
  async count(where?: Prisma.ClientSessionWhereInput): Promise<number> {
    return this.prisma.clientSession.count({ where });
  }
}
