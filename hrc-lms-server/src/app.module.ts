// src/app.module.ts

import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { ConfigModule, ConfigService } from '@nestjs/config'; // 🚨 Thêm import này
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { RolesModule } from './roles/roles.module';
import { PermissionsModule } from './permissions/permissions.module';
import { CategoriesModule } from './categories/categories.module';
import { CoursesModule } from './courses/courses.module';
import { EmailModule } from './email/email.module';
import { MailerModule } from '@nestjs-modules/mailer';
import { ClassesModule } from './class/classes.module';
import { EnrollmentsModule } from './enrollment/enrollments.module';
import { SessionsModule } from './class-session/class-sessions.module';
import { AttendanceModule } from './attendance/attendance.module';
import { ImageModule } from './image/image.module';


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
    MailerModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (config: ConfigService) => ({
        transport: {
          host: config.get('MAIL_HOST'),
          port: config.get<number>('MAIL_PORT'),
          secure: false, // true cho cổng 465, false cho các cổng khác
          auth: {
            user: config.get('MAIL_USER'),
            pass: config.get('MAIL_PASS'),
          },
        },
        defaults: {
          from: config.get('MAIL_FROM'),
        },
      }),
      inject: [ConfigService],
    }),
    EmailModule,
    ClassesModule,
    EnrollmentsModule,
    SessionsModule,
    AttendanceModule,
    ImageModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
