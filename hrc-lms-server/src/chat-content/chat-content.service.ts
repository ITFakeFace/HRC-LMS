import { Injectable } from '@nestjs/common';
import { CreateChatContentDto } from './dto/create-chat-content.dto';
import { QueryChatContentDto } from './dto/query-chat-content.dto';
import { ChatContentRepository } from './chat-content.repository';
import { Prisma } from '@prisma/client';

@Injectable()
export class ChatContentService {
  constructor(private readonly repository: ChatContentRepository) {}

  // Lưu tin nhắn mới (Được gọi bởi cả Controller và Socket Gateway)
  async create(dto: CreateChatContentDto) {
    // 1. CHUẨN BỊ DỮ LIỆU (Mapping DTO -> Prisma Input)
    const prismaInput: Prisma.ChatContentCreateInput = {
      message: dto.message,
      isRead: false,

      // Map sessionId (số) -> session (relation)
      session: {
        connect: { id: dto.sessionId },
      },

      // Map senderId -> sender (relation)
      // Logic: Nếu có senderId (Bot -1 hoặc User > 0) thì connect, Guest (null) thì thôi
      ...(dto.senderId ? { sender: { connect: { id: dto.senderId } } } : {}),
    };

    // 2. GỌI REPO
    return this.repository.create(prismaInput);
  }

  // Lấy lịch sử tin nhắn
  async getHistory(query: QueryChatContentDto) {
    const { sessionId, page, limit } = query;
    if (!sessionId) {
      throw new Error('Session ID is required'); // Hoặc xử lý lỗi theo ResponseModel
    }
    return await this.repository.findBySessionId(sessionId, page, limit);
  }
}
