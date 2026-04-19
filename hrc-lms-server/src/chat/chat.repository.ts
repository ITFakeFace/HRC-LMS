import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service'; // Đường dẫn tới PrismaService của bạn
import { Prisma, ChatContent } from '@prisma/client';
import { CreateChatContentDto } from 'src/chat-content/dto/create-chat-content.dto';

@Injectable()
export class ChatRepository {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Lưu tin nhắn mới vào DB
   */
  async create(data: CreateChatContentDto): Promise<ChatContent> {
    return this.prisma.chatContent.create({
      data: {
        message: data.message,
        isRead: false, // Mặc định là chưa đọc
        // Kết nối Session
        session: { connect: { id: data.sessionId } },
        // Kết nối Sender (nếu có senderId) - Xử lý null an toàn
        ...(data.senderId && { sender: { connect: { id: data.senderId } } }),
      },
      // Include luôn sender để trả về avatar/tên ngay lập tức cho UI
      include: {
        sender: {
          select: { id: true, fullname: true, avatar: true, email: true },
        },
      },
    });
  }

  /**
   * Lấy danh sách tin nhắn theo Session ID (Có phân trang)
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
        // Sắp xếp tin nhắn mới nhất lên đầu (để Client đảo ngược lại hoặc load more lên trên)
        orderBy: { createdAt: 'desc' },
        include: {
          sender: {
            select: { id: true, fullname: true, avatar: true },
          },
        },
      }),
      this.prisma.chatContent.count({
        where: { sessionId },
      }),
    ]);

    return { items, total };
  }

  /**
   * Đánh dấu toàn bộ tin nhắn trong Session là "Đã đọc"
   * (Thường dùng khi Admin vào xem tin nhắn của User hoặc ngược lại)
   */
  async markAsRead(
    sessionId: number,
    senderIdToExclude?: number,
  ): Promise<void> {
    // Logic: Update isRead = true cho những tin nhắn KHÔNG PHẢI do mình gửi
    // (Ví dụ: Admin đọc tin thì chỉ mark tin của User là đã đọc)

    const whereCondition: Prisma.ChatContentWhereInput = {
      sessionId,
      isRead: false,
    };

    if (senderIdToExclude) {
      // Nếu có senderIdToExclude (người đang xem), ta chỉ update tin của "đối phương"
      // senderId khác senderIdToExclude
      whereCondition.senderId = { not: senderIdToExclude };

      // Lưu ý: Nếu chat content của Guest (senderId = null) thì logic này vẫn đúng
      // nếu senderIdToExclude là Admin (có ID).
    }

    await this.prisma.chatContent.updateMany({
      where: whereCondition,
      data: { isRead: true },
    });
  }

  /**
   * Đếm số tin nhắn chưa đọc của một Session (Dành cho Dashboard Admin)
   */
  async countUnreadMessages(sessionId: number): Promise<number> {
    return this.prisma.chatContent.count({
      where: {
        sessionId,
        isRead: false,
        // Thường là đếm tin của User gửi (Admin chưa đọc)
        // Nếu User gửi thì senderId thường khác null hoặc khác ID admin
        senderId: { not: null },
      },
    });
  }

  /**
   * Xóa tin nhắn (Optional)
   */
  async delete(id: number): Promise<ChatContent> {
    return this.prisma.chatContent.delete({
      where: { id },
    });
  }
}
