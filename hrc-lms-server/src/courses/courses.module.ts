import { Module } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CoursesController } from './course.controller';
import { CoursesService } from './course.serivce';
import { CoursesRepository } from './course.repository';

@Module({
  controllers: [CoursesController],
  providers: [
    CoursesService, 
    CoursesRepository, 
    PrismaService // Cung cấp PrismaService để Repository sử dụng
  ],
  exports: [CoursesService], // Export Service nếu sau này module khác (ví dụ Enrollment) cần kiểm tra khóa học
})
export class CoursesModule {}