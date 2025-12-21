import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { EnrollmentsModule } from 'src/enrollment/enrollments.module';
import { AttendanceSessionsController } from './attendance-session.controller';
import { AttendanceRecordsController } from './attendance-record.controller';
import { AttendanceSessionsService } from './attendance-session.service';
import { AttendanceRecordsService } from './attendance-record.service';
import { AttendanceRepository } from './attendance.repository';

@Module({
  imports: [
    PrismaModule, 
    EnrollmentsModule // QUAN TRỌNG: Import module này để inject EnrollmentRepository vào Service
  ],
  controllers: [AttendanceSessionsController, AttendanceRecordsController],
  providers: [
    AttendanceSessionsService, 
    AttendanceRecordsService, 
    AttendanceRepository
  ],
})
export class AttendanceModule {}