// src/users/user.repository.ts
import { Injectable } from '@nestjs/common';
import { User, Prisma, Permission } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { UserDto } from './dto/user.dto';
import { UserMapper } from './mapper/user.mapper';
import { BasicRoleDto } from 'src/roles/dto/role.dto';

@Injectable()
export class UserRepository {
  constructor(private prisma: PrismaService) {}

  async findAll(): Promise<User[]> {
    const query = await this.prisma.user.findMany({
      include: { roles: true },
      orderBy: { createdAt: 'desc' },
    });
    return query;
  }

  async findByEmail(
    email: string,
  ): Promise<Prisma.UserGetPayload<{ include: { roles: true } }> | null> {
    return this.prisma.user.findUnique({
      where: { email },
      include: {
        roles: true,
      },
    });
  }

  async findByUsername(
    username: string,
  ): Promise<Prisma.UserGetPayload<{ include: { roles: true } }> | null> {
    return this.prisma.user.findUnique({
      where: { username },
      include: {
        roles: true,
      },
    });
  }

  async findByPID(
    pID: string,
  ): Promise<Prisma.UserGetPayload<{ include: { roles: true } }> | null> {
    return this.prisma.user.findUnique({
      where: { pID },
      include: {
        roles: true,
      },
    });
  }

  async findById(
    id: number,
  ): Promise<Prisma.UserGetPayload<{ include: { roles: true } }> | null> {
    return this.prisma.user.findUnique({
      where: { id },
      include: {
        roles: true,
      },
    });
  }

  async create(data: Prisma.UserCreateInput): Promise<User> {
    return this.prisma.user.create({ data });
  }

  async addRoles(userId: number, roleIds: number[]): Promise<User> {
    const connectRoles = roleIds.map((id) => ({ id }));

    return this.prisma.user.update({
      where: { id: userId },
      data: {
        roles: {
          connect: connectRoles,
        },
      },
    });
  }

  async removeRoles(userId: number, roleIds: number[]): Promise<User> {
    const disconnectRoles = roleIds.map((id) => ({ id }));

    return this.prisma.user.update({
      where: { id: userId },
      data: {
        roles: {
          disconnect: disconnectRoles,
        },
      },
    });
  }

  async update(id: number, data: Prisma.UserUpdateInput): Promise<User> {
    return this.prisma.user.update({
      where: { id },
      data,
    });
  }

  async delete(id: number): Promise<User> {
    return this.prisma.user.delete({
      where: { id },
    });
  }

  async getRolesByUserId(userId: number): Promise<BasicRoleDto[]> {
    return this.prisma.role.findMany({
      where: {
        // 🎯 Sử dụng cú pháp `some` cho mối quan hệ Nhiều-Nhiều
        users: {
          some: {
            id: userId, // Tìm những Role mà có ít nhất một User có ID này
          },
        },
      },
      // Tùy chọn: Chọn lọc các trường nếu BasicRoleDto là một tập hợp con của Role model
      select: {
        id: true,
        fullname: true,
        shortname: true,
        // ... thêm các trường khác nếu cần cho BasicRoleDto
      },
    });
  }

  async getPermissionsByUserId(userId: number): Promise<Permission[]> {
    const rawPermissions = await this.prisma.$queryRaw<Permission[]>`
      WITH RECURSIVE RoleInheritance AS (
          -- Anchor: Lấy Role ID được gán trực tiếp cho User
          SELECT T1.A AS roleId             -- A = Role ID (vì R trước U)
          FROM \`_UserRoles\` AS T1
          WHERE T1.B = ${userId}           -- B = User ID
          
          UNION 
          
          -- Recursive Term: Tìm Role cha
          SELECT H.parentId AS roleId
          FROM \`RoleHierarchies\` AS H 
          INNER JOIN RoleInheritance AS RI ON H.childId = RI.roleId
      )
      
      -- Truy vấn Permissions từ tập hợp Role ID cuối cùng
      SELECT DISTINCT
          P.id,
          P.name,
          P.description
      FROM \`Permissions\` AS P 
      -- Tham gia với bảng liên kết Role_Permissions
      INNER JOIN \`_RolePermissions\` AS RP ON RP.A = P.id -- A = Permission ID (vì P trước R)
      INNER JOIN RoleInheritance AS RI ON RP.B = RI.roleId; -- B = Role ID
    `;
    return rawPermissions as Permission[];
  }
}
