import { Module } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { RoleRepository } from './role.repository';
import { RoleService } from './role.service';
import { RoleController } from './role.controller';

@Module({
  controllers: [RoleController],
  providers: [
    // Khai báo các thành phần có thể được inject
    PrismaService, // Cung cấp Prisma Client
    RoleRepository, // Cung cấp Repository
    RoleService, // Cung cấp Service (chứa Business Logic)
  ],
  exports: [
    // Export các thành phần mà các Module khác có thể cần (ví dụ: UserModule)
    RoleService,
    RoleRepository, // Tùy chọn, nếu logic DB cần được chia sẻ
  ],
})
export class RolesModule {}
