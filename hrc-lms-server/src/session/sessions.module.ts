// src/session/session.module.ts
import { Module } from '@nestjs/common';
import { SessionService } from './session.service';
import { SessionController } from './session.controller';
import { SessionRepository } from './session.repository';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [SessionController],
  providers: [SessionService, SessionRepository],
  exports: [SessionService], // Xuất ra để dùng ở các module khác (ví dụ: Chat Gateway)
})
export class SessionModule {}
