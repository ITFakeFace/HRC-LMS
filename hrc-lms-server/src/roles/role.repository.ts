import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma, Role } from '@prisma/client';
import { PermissionDto } from 'src/permissions/dto/permission.dto';
import { RoleFullModel } from './dto/RoleFullModel';
import { RoleDto } from './dto/role.dto';

@Injectable()
export class RoleRepository {
  constructor(private prisma: PrismaService) {}

  async getAggregatedPermissions(roleId: number): Promise<PermissionDto[]> {
    // Giả định: A = roleId, B = permissionId (cột không cần dấu ngược nháy)
    const ROLE_FK = `B`;
    const PERMISSION_FK = `A`;

    // Sử dụng Prisma.sql cho toàn bộ truy vấn và ký hiệu MySQL
    const rawSql = Prisma.sql`
        -- Tên bảng đã được map: Roles, Permissions, RoleHierarchies
        -- Tên bảng ẩn: _RolePermissions, _UserRoles

        WITH RECURSIVE RoleAncestors AS (
            -- Anchor: Bắt đầu từ Role hiện tại
            SELECT T1.id
            FROM \`Roles\` AS T1
            WHERE T1.id = ${roleId}
            
            UNION 

            -- Recursive Term: Tìm Role cha (Parent)
            SELECT H.parentId
            FROM \`RoleHierarchies\` AS H
            INNER JOIN RoleAncestors AS RA ON H.childId = RA.id
        )
        SELECT DISTINCT
            P.id,
            P.name,
            P.description
        FROM RoleAncestors AS RA
        -- Tham gia với bảng liên kết ẩn '_RolePermissions'
        INNER JOIN \`_RolePermissions\` AS RP 
            -- Cột A/B không cần dấu nháy vì là tên cột nội bộ
            ON RP.${Prisma.raw(ROLE_FK)} = RA.id 
        -- Tham gia với bảng Permissions
        INNER JOIN \`Permissions\` AS P 
            ON RP.${Prisma.raw(PERMISSION_FK)} = P.id;
    `;

    // Ép kiểu kết quả trả về
    return this.prisma.$queryRaw<PermissionDto[]>(rawSql);
  }

  /**
   * Lấy Role dựa trên ID, lồng ghép Permissions.
   */
  async findById(id: number): Promise<RoleFullModel | null> {
    return this.prisma.role.findUnique({
      where: { id },
      include: {
        users: true,
        permissions: true,
        parentRoles: {
          include: { parent: true }, // RoleHierarchy.parent là Role cha
        },
        childRoles: {
          include: { child: true }, // RoleHierarchy.child là Role con
        },
      },
    });
  }

  /**
   * Lấy tất cả Roles, lồng ghép Permissions.
   */
  async findAll(): Promise<RoleFullModel[]> {
    return this.prisma.role.findMany({
      include: {
        users: true,
        permissions: true,
        parentRoles: {
          include: { parent: true }, // RoleHierarchy.parent là Role cha
        },
        childRoles: {
          include: { child: true }, // RoleHierarchy.child là Role con
        },
      },
    });
  }

  // async findByIdWithAggregatedPermissions(id: number): Promise<RoleDto | null> {
  //   // 1. Lấy dữ liệu Role cơ bản và Hierarchy
  //   const role = await this.prisma.role.findUnique({
  //     where: { id },
  //     include: {
  //       users: true,
  //       parentRoles: { include: { parent: true } },
  //       childRoles: { include: { child: true } },
  //     },
  //   });

  //   if (!role) {
  //     return null;
  //   }

  //   // 2. Lấy TẤT CẢ Permissions (Trực tiếp + Thừa kế)
  //   const aggregatedPermissions = await this.getAggregatedPermissions(id);

  //   // 3. Trả về đối tượng Role đã được tổng hợp
  //   // Đây là cấu trúc dữ liệu custom (không phải kiểu Prisma Role)
  //   return {
  //     ...role,
  //     permissions: aggregatedPermissions, // Sử dụng tên trường 'permissions' duy nhất
  //     // Loại bỏ các trường trung gian phức tạp nếu không cần thiết
  //   };
  // }

  /**
   * Lấy tất cả Roles, TỔNG HỢP Permissions (Trực tiếp + Thừa kế) cho mỗi Role.
   */
  async findAllWithAggregatedPermissions() {
    // 1. Lấy tất cả Roles
    const allRoles = await this.prisma.role.findMany({
      include: {
        users: true,
        parentRoles: { include: { parent: true } },
        childRoles: { include: { child: true } },
      },
    });

    // 2. Lặp qua từng Role và lấy Permissions tổng hợp
    const rolesWithPermissions = await Promise.all(
      allRoles.map(async (role) => {
        const aggregatedPermissions = await this.getAggregatedPermissions(
          role.id,
        );
        return {
          ...role,
          permissions: aggregatedPermissions,
        };
      }),
    );

    return rolesWithPermissions;
  }

  async findExactByShortname(shortname: string): Promise<Role | null> {
    return this.prisma.role.findFirst({
      where: { shortname },
    });
  }

  async getRoleFullModel(tx: any, roleId: number): Promise<RoleFullModel> {
    // Sử dụng transaction client (tx) để đảm bảo nó nằm trong cùng transaction
    return tx.role.findUnique({
      where: { id: roleId },
      include: {
        userRoles: true,
        parentRoles: { include: { parent: true } },
        childRoles: { include: { child: true } },
        // KHÔNG cần include permissions ở đây, vì chúng ta sẽ dùng CTE
      },
    });
  }

  /**
   * Tạo Role mới (bao gồm cả gán Permission ban đầu).
   * @param data Dữ liệu tạo Role, bao gồm mảng permissionIds.
   */
  async create(data: Prisma.RoleCreateInput): Promise<Role> {
    return this.prisma.role.create({
      data,
      include: {
        permissions: true,
      },
    });
  }

  /**
   * Cập nhật Role cơ bản và trả về kết quả cuối cùng (không xử lý thêm/bớt Permission ở đây).
   * @param id ID của Role cần cập nhật.
   * @param data Dữ liệu cập nhật.
   */
  async update(id: number, data: Prisma.RoleUpdateInput): Promise<Role> {
    return this.prisma.role.update({
      where: { id },
      data,
      include: {
        permissions: true,
      },
    });
  }

  async delete(id: number): Promise<Role> {
    // Lệnh này sẽ ném ra lỗi P2025 nếu Role không tồn tại.
    // Logic xử lý lỗi này được chuyển lên RoleService.
    return this.prisma.role.delete({
      where: { id },
    });
  }

  // --- Logic Quản lý Quan hệ RolePermission ---

  /**
   * Xóa các liên kết Permission khỏi Role (DELETE RolePermission records).
   */
  async removePermissions(
    roleId: number,
    permissionIds: number[],
  ): Promise<Role> {
    // Trả về Role đã được cập nhật
    return this.prisma.role.update({
      where: { id: roleId },
      data: {
        permissions: {
          // Lệnh disconnect sẽ xóa các liên kết trong bảng trung gian
          // nơi RoleId = roleId VÀ PermissionId nằm trong permissionIds
          disconnect: permissionIds.map((id) => ({ id })),
        },
      },
      // Bạn có thể chọn chỉ trả về ID, hoặc trả về Role đã cập nhật
    });
  }

  /**
   * Thêm các liên kết Permission mới vào Role (CREATE RolePermission records).
   */
  async addPermissions(roleId: number, permissionIds: number[]): Promise<Role> {
    // Trả về Role đã được cập nhật
    return this.prisma.role.update({
      where: { id: roleId },
      data: {
        permissions: {
          // Lệnh connect sẽ tạo các liên kết mới (RolePermission)
          // và tự động bỏ qua nếu liên kết đã tồn tại (skipDuplicates tích hợp)
          connect: permissionIds.map((id) => ({ id })),
        },
      },
    });
  }
}
