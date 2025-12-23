import { Module } from '@nestjs/common';
import { ClassSessionsController } from './class-sessions.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { EnrollmentsModule } from 'src/enrollment/enrollments.module';
import { ClassSessionsService } from './class-session.service';
import { ClassSessionRepository } from './class-session.repository';

@Module({
  imports: [
    PrismaModule, 
    EnrollmentsModule // Import module này để inject được EnrollmentRepository
  ],
  controllers: [ClassSessionsController],
  providers: [ClassSessionsService, ClassSessionRepository],
  exports: [ClassSessionsService],
})
export class SessionsModule {}