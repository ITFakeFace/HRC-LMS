import { Module } from '@nestjs/common';
import { EmailService } from './email.service';
import { EmailController } from './email.controller';

@Module({
  controllers: [EmailController], // Đăng ký Controller
  providers: [EmailService],
  exports: [EmailService],
})
export class EmailModule {}
