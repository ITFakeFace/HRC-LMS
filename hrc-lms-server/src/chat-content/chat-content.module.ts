import { Module } from '@nestjs/common';
import { ChatContentService } from './chat-content.service';
import { ChatContentController } from './chat-content.controller';
import { ChatContentRepository } from './chat-content.repository'; // <--- Import
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [ChatContentController],
  providers: [
    ChatContentService,
    ChatContentRepository, // <--- Đăng ký Provider
  ],
  exports: [
    ChatContentService, // Export Service (để Gateway dùng)
    ChatContentRepository, // (Tùy chọn) Export Repository nếu cần dùng trực tiếp
  ],
})
export class ChatContentModule {}
