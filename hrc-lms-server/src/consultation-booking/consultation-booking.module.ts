// src/consultation-booking/consultation-booking.module.ts

import { Module } from '@nestjs/common';
import { ConsultationBookingController } from './consultation-booking.controller';
import { ConsultationBookingService } from './consultation-booking.service';
import { ConsultationBookingRepository } from './consultation-booking.repository';
import { PrismaModule } from 'src/prisma/prisma.module'; // Import module chứa PrismaService

@Module({
  imports: [
    PrismaModule, // Cần thiết để Repository sử dụng được PrismaService
  ],
  controllers: [ConsultationBookingController],
  providers: [
    ConsultationBookingService,
    ConsultationBookingRepository, // Đừng quên khai báo Repository ở đây
  ],
  exports: [
    ConsultationBookingService, // Export nếu muốn module khác dùng được Service này
  ],
})
export class ConsultationBookingModule {}
