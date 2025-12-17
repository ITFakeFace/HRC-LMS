import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service'; // Đường dẫn tới PrismaService của bạn
import { ClientSession } from '@prisma/client';

@Injectable()
export class SessionService {
  constructor(private prisma: PrismaService) {}

  /**
   * Tạo phiên chat mới
   * Thường được gọi khi khách hàng lần đầu mở widget chat
   */
  async createSession(): Promise<ClientSession> {
    return await this.prisma.clientSession.create({
      data: {
        AIEnable: true, // Mặc định bật AI
        isEnded: false,
      },
    });
  }

  /**
   * Lấy chi tiết phiên chat
   * @param id ID của session
   * @param includeMessages Có lấy kèm tin nhắn cũ không? (Mặc định false để nhẹ)
   */
  async getSession(id: number, includeMessages = false): Promise<ClientSession | null> {
    const session = await this.prisma.clientSession.findUnique({
      where: { id },
      include: {
        // Nếu cần lấy tin nhắn thì include, sắp xếp tin nhắn cũ nhất -> mới nhất
        messages: includeMessages
          ? {
              orderBy: { createdAt: 'asc' },
              include: {
                 sender: { // Lấy thông tin người gửi nếu là User/Admin
                   select: { id: true, fullname: true, avatar: true, roles: true }
                 }
              }
            }
          : false,
      },
    });

    if (!session) {
      throw new NotFoundException(`Không tìm thấy phiên chat với ID: ${id}`);
    }

    return session;
  }

  /**
   * Kiểm tra xem Session có đang bật AI không
   * Dùng để Gateway quyết định có gọi OpenAI/Gemini không
   */
  async checkAiStatus(id: number): Promise<boolean> {
    const session = await this.prisma.clientSession.findUnique({
      where: { id },
      select: { AIEnable: true, isEnded: true },
    });

    if (!session) return false;
    if (session.isEnded) return false; // Đã kết thúc thì AI cũng không trả lời

    return session.AIEnable;
  }

  /**
   * Tắt AI (Chuyển sang chế độ Nhân viên tư vấn)
   * Gọi hàm này khi Agent bắt đầu reply
   */
  async disableAI(id: number): Promise<ClientSession> {
    return await this.prisma.clientSession.update({
      where: { id },
      data: { AIEnable: false },
    });
  }

  /**
   * Bật lại AI (Nếu nhân viên rời đi hoặc chuyển về tự động)
   */
  async enableAI(id: number): Promise<ClientSession> {
    return await this.prisma.clientSession.update({
      where: { id },
      data: { AIEnable: true },
    });
  }

  /**
   * Kết thúc phiên chat
   */
  async endSession(id: number): Promise<ClientSession> {
    return await this.prisma.clientSession.update({
      where: { id },
      data: { 
        isEnded: true,
        AIEnable: false // Tắt AI luôn cho chắc
      },
    });
  }
  
  /**
   * (Tùy chọn) Tìm phiên chat đang hoạt động gần nhất của một User (nếu bạn có lưu UserID vào Session)
   * Hiện tại Schema của bạn Session chưa link với User, nên hàm này chỉ mang tính tham khảo
   */
   // async findActiveSession() { ... }
} 