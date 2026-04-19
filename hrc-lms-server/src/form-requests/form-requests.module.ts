import { Module } from '@nestjs/common';
import { FormRequestsService } from './form-requests.service';
import { FormRequestsController } from './form-requests.controller';
import { FormRequestsRepository } from './form-requests.repository';
import { PrismaModule } from 'src/prisma/prisma.module'; // Import module chứa PrismaService

@Module({
  imports: [PrismaModule], // 👈 Quan trọng: Để Inject được PrismaService vào Repository
  controllers: [FormRequestsController],
  providers: [FormRequestsService, FormRequestsRepository],
  exports: [FormRequestsService], // Export nếu module khác cần dùng service này
})
export class FormRequestsModule {}