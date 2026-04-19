import { Module, Res } from '@nestjs/common';
import { ChatGateway } from './chat.gateway';
import { ChatService } from './chat.service';
import { SessionService } from 'src/session/session.service';
import { SessionModule } from 'src/session/sessions.module';
import { AiModule } from 'src/ai/ai.module';
import { ChatContentModule } from 'src/chat-content/chat-content.module';
import { ResponseFormatterModule } from 'src/utils/response-formater.module';
import { PrismaModule } from 'src/prisma/prisma.module';
import { ConsultationBookingModule } from 'src/consultation-booking/consultation-booking.module';

@Module({
  imports: [
    PrismaModule,
    SessionModule,
    AiModule,
    ChatContentModule,
    ResponseFormatterModule,
    ConsultationBookingModule,
  ],
  providers: [ChatGateway, ChatService],
})
export class ChatModule {}
