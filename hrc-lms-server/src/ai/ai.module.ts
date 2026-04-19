import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { AiService } from './ai.service';

@Module({
  imports: [
    HttpModule.register({
      timeout: 120000, // Đợi tối đa 30s cho AI trả lời
      maxRedirects: 5,
    }),
  ],
  providers: [AiService],
  exports: [AiService], // Export để ChatGateway dùng được
})
export class AiModule {}
