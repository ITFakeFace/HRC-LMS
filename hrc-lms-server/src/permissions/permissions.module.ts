import { Module } from '@nestjs/common';
import { PermissionController } from './permission.controller';
import { PermissionRepository } from './permission.repository';
import { PermissionService } from './permission.service';
import { PrismaService } from 'src/prisma/prisma.service';

@Module({
  imports: [
    // ... các modules cần thiết ...
  ],
  controllers: [PermissionController], // Controller sử dụng Service
  providers: [
    PermissionService, // <--- ĐĂNG KÝ SERVICE
    PermissionRepository, // <--- ĐĂNG KÝ REPOSITORY (Dependency của Service)
    PrismaService, // <--- ĐĂNG KÝ CÁC DEPENDENCIES CẦN THIẾT
  ],
  // Nếu các modules khác cần sử dụng PermissionService
  exports: [PermissionService, PermissionRepository],
})
export class PermissionsModule {}
