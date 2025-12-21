import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { EnrollmentsService } from './enrollment.service';
import { EnrollmentsController } from './enrollments.controller';
import { EnrollmentRepository } from './enrollment.repository';

@Module({
  imports: [PrismaModule],
  controllers: [EnrollmentsController],
  providers: [EnrollmentsService, EnrollmentRepository],
  // QUAN TRỌNG: Phải export Repository để AttendanceModule dùng được
  exports: [EnrollmentRepository, EnrollmentsService], 
})
export class EnrollmentsModule {}