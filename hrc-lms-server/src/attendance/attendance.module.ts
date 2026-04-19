import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { AttendanceRecordsController } from './attendance-record.controller';
import { AttendanceRecordsService } from './attendance-record.service';
import { AttendanceRecordRepository } from './attendance.repository';

@Module({
  imports: [PrismaModule],
  controllers: [AttendanceRecordsController],
  providers: [AttendanceRecordsService, AttendanceRecordRepository],
  exports: [AttendanceRecordsService],
})
export class AttendanceModule {}