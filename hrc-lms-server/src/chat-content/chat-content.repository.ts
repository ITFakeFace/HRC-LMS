import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateChatContentDto } from './dto/create-chat-content.dto';
import { ChatContent, Prisma } from '@prisma/client';

@Injectable()
export class ChatContentRepository {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Tạo tin nhắn mới
   * Tự động nối với Session và User (nếu có senderId)
   */
  async create(data: Prisma.ChatContentCreateInput): Promise<ChatContent> {
    return this.prisma.chatContent.create({
      data, // Dữ liệu đã được Service chuẩn bị sẵn cấu trúc
      include: {
        sender: {
          select: {
            id: true,
            fullname: true,
            avatar: true,
            email: true,
          },
        },
      },
    });
  }

  /**
   * Lấy lịch sử tin nhắn theo Session (Phân trang)
   * Sắp xếp: Mới nhất lên đầu (Client sẽ đảo ngược lại để hiển thị từ dưới lên)
   */
  async findBySessionId(
    sessionId: number,
    page: number = 1,
    limit: number = 20,
  ): Promise<{ items: ChatContent[]; total: number }> {
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      this.prisma.chatContent.findMany({
        where: { sessionId },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' }, // Lấy tin mới nhất trước
        include: {
          sender: {
            select: { id: true, fullname: true, avatar: true },
          },
        },
      }),
      this.prisma.chatContent.count({ where: { sessionId } }),
    ]);

    return { items, total };
  }

  /**
   * Đánh dấu "Đã đọc" cho các tin nhắn trong Session
   * @param sessionId ID của phiên chat
   * @param excludeSenderId ID của người đang xem (để không mark tin của chính mình là đã đọc - tùy logic)
   */
  async markAsRead(sessionId: number, excludeSenderId?: number): Promise<void> {
    const whereCondition: Prisma.ChatContentWhereInput = {
      sessionId,
      isRead: false, // Chỉ update những tin chưa đọc
    };

    // Nếu truyền vào ID người xem, ta chỉ đánh dấu tin của "người kia" là đã đọc
    if (excludeSenderId) {
      whereCondition.senderId = { not: excludeSenderId };
    }

    await this.prisma.chatContent.updateMany({
      where: whereCondition,
      data: { isRead: true },
    });
  }

  /**
   * Đếm số tin nhắn chưa đọc (Dùng cho Admin Dashboard để hiện badge đỏ)
   */
  async countUnread(sessionId: number): Promise<number> {
    return this.prisma.chatContent.count({
      where: {
        sessionId,
        isRead: false,
        senderId: { not: null }, // Thường chỉ đếm tin của khách/user gửi
      },
    });
  }

  /**
   * Lấy tin nhắn mới nhất của session (Dùng cho hiển thị preview ở list chat)
   */
  async findLatestMessage(sessionId: number): Promise<ChatContent | null> {
    return this.prisma.chatContent.findFirst({
      where: { sessionId },
      orderBy: { createdAt: 'desc' },
    });
  }
}
