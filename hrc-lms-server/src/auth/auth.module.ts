// src/auth/auth.module.ts
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UsersModule } from '../users/users.module'; // Import UsersModule

// Strategies
import { JwtStrategy } from './strategies/jwt.strategy';
import { JwtRefreshStrategy } from './strategies/jwt-refresh.strategy';
import { RolesModule } from 'src/roles/roles.module';
import { PermissionsModule } from 'src/permissions/permissions.module';

@Module({
  imports: [
    UsersModule,
    RolesModule,
    PermissionsModule,
    PassportModule,
    JwtModule.register({}), // Cấu hình secret/signOptions trong .env hoặc ở AuthService
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    JwtStrategy, // Thêm Access Token Strategy
    JwtRefreshStrategy, // Thêm Refresh Token Strategy
  ],
})
export class AuthModule {}
