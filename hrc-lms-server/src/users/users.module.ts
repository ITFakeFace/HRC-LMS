// src/users/users.module.ts
import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { RefreshTokenRepository } from './refresh-token.repository/refresh-token.repository.service';
import { UserRepository } from './user.repository';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { RoleRepository } from 'src/roles/role.repository';

@Module({
  imports: [PrismaModule], // Đảm bảo PrismaModule được import
  controllers: [UsersController], 
  providers: [
    UserRepository, 
    RoleRepository,
    RefreshTokenRepository, 
    UsersService
  ],
  exports: [UserRepository, RefreshTokenRepository, UsersService], 
})
export class UsersModule {}