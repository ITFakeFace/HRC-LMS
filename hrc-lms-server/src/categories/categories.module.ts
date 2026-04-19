import { Module } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service'; 
import { CategoriesController } from './category.controller';
import { CategoriesService } from './category.service';
import { CategoriesRepository } from './category.repository';
// Lưu ý: Nếu bạn đã có PrismaModule riêng, hãy import PrismaModule vào imports thay vì để PrismaService ở providers.
// Nhưng để đơn giản, mình để PrismaService ở đây theo code cũ của bạn.

@Module({
  controllers: [CategoriesController],
  providers: [
    CategoriesService, 
    CategoriesRepository, 
    PrismaService // Cần cái này để Repository hoạt động
  ],
  exports: [CategoriesService], // Export nếu module khác (ví dụ CourseModule) cần dùng CategoriesService
})
export class CategoriesModule {}