// src/app.module.ts

import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { ConfigModule } from '@nestjs/config'; // 🚨 Thêm import này
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { RolesModule } from './roles/roles.module';
import { PermissionsModule } from './permissions/permissions.module';
import { CategoriesModule } from './categories/categories.module';
import { CoursesModule } from './courses/courses.module';


@Module({
  imports: [
    // 1. ConfigModule phải được tải đầu tiên và là Global
    ConfigModule.forRoot({
      isGlobal: true,
      // Đảm bảo đường dẫn .env được load chính xác
      // envFilePath: ['.env'],
    }),

    // 2. Sau đó import PrismaModule
    PrismaModule,
    UsersModule,
    AuthModule,
    PermissionsModule,
    RolesModule,
    CategoriesModule,
    CoursesModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
