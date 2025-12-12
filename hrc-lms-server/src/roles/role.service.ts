import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { Prisma, Role } from '@prisma/client';
import { RoleRepository } from './role.repository';
import {
  ResponseFlatteredRoleDto,
  ResponseRoleDto,
} from './dto/response-role.dto';
import { ResponsePermissionDto } from 'src/permissions/dto/response-permission.dto';
import { RoleMapper } from './mapper/role.mapper';
import { BasicRoleDto, FlatteredRoleDto, RoleDto } from './dto/role.dto';

@Injectable()
export class RoleService {
  constructor(
    private roleRepository: RoleRepository,
    private prisma: PrismaService, // Cần cho $transaction
  ) {}

  /**
   * Helper: Ánh xạ dữ liệu trả về từ Repository (đã tổng hợp) sang ResponseRoleDto.
   * Lưu ý: Khi sử dụng phương thức Aggregated, permissions đã được làm phẳng.
   */

  // --- READ OPERATIONS (Sử dụng phương thức tổng hợp permissions mới) ---

  async findAll(): Promise<FlatteredRoleDto[]> {
    // ✅ Sử dụng phương thức tổng hợp permissions
    const roles = await this.roleRepository.findAll();
    const result: FlatteredRoleDto[] = [];
    roles.forEach(async (role) => {
      const resDto: FlatteredRoleDto = {
        id: role.id,
        fullname: role.fullname,
        shortname: role.shortname,
        users: role.users.map((user) => user.id),
        parentRoles: role.parentRoles.map((parent) => parent.parentId),
        childRoles: role.childRoles.map((child) => child.childId),
        permissions: role.permissions.map((perm) => perm.id),
      };
      result.push(resDto);
    });
    return result;
  }

  async findById(id: number): Promise<ResponseRoleDto> {
    // ✅ Sử dụng phương thức tổng hợp permissions
    const role = await this.roleRepository.findById(id);
    const result = new ResponseRoleDto();
    if (!role) {
      result.pushError({
        key: 'global',
        value: `Không tìm thấy role với id ${id}`,
      });
      return result;
    }
    result.role = {
      id: role.id,
      fullname: role.fullname,
      shortname: role.shortname,
      childRoles: role.childRoles.map((child) => child.child),
      parentRoles: role.parentRoles.map((parent) => parent.parent),
      users: role.users,
      permissions: role.permissions,
    };
    return result;
  }

  // --- CREATE OPERATION (Thêm logic tạo RoleHierarchy) ---

  async create(data: CreateRoleDto): Promise<ResponseRoleDto> {
    const {
      permissions: permissionIds,
      parentRoles: parentRoleIds,
      ...roleBaseData
    } = data;
    const res = new ResponseRoleDto();

    // Khối kiểm tra xung đột (Pre-check validation)
    const existedRole = await this.prisma.role.findMany({
      // Dùng this.prisma (ngoài tx) để kiểm tra nhanh
      where: {
        OR: [
          { fullname: roleBaseData.fullname },
          { shortname: roleBaseData.shortname },
        ],
      },
    });

    if (existedRole.length > 0) {
      // Ghi lại lỗi LOGIC
      if (existedRole.some((r) => r.fullname === roleBaseData.fullname)) {
        res.pushError({ key: 'fullname', value: 'Fullname existed' });
      }
      if (existedRole.some((r) => r.shortname === roleBaseData.shortname)) {
        res.pushError({ key: 'shortname', value: 'Shortname existed' });
      }

      // Thoát sớm nếu có lỗi logic (trả về res.errors)
      if (res.errors.length > 0) {
        // Không cần bắt đầu transaction nếu đã có lỗi logic rõ ràng
        return res;
      }
    }

    // Nếu không có lỗi logic (hoặc lỗi logic đã được kiểm soát)
    // Bắt đầu Transaction
    return this.prisma.$transaction(async (tx) => {
      // --- BƯỚC 1: Chuẩn bị dữ liệu Role ---
      const permissionConnect = permissionIds?.map((id) => ({ id })) || [];
      const roleData: Prisma.RoleCreateInput = {
        fullname: roleBaseData.fullname,
        shortname: roleBaseData.shortname,
        permissions: { connect: permissionConnect },
      };

      // --- BƯỚC 2: Tạo Role mới ---
      try {
        const newRole = await tx.role.create({ data: roleData });

        // --- BƯỚC 3: Tạo RoleHierarchy ---
        if (parentRoleIds && parentRoleIds.length > 0) {
          const newHierarchies = parentRoleIds.map((parentId) => ({
            parentId,
            childId: newRole.id,
          }));

          await tx.roleHierarchy.createMany({
            data: newHierarchies,
            skipDuplicates: true,
          });
        }

        // --- BƯỚC 4 & 5: Lấy lại dữ liệu tổng hợp và Map ---
        // Lấy quyền thừa kế (aggregated permissions)
        const aggregatedPermissions =
          await this.roleRepository.getAggregatedPermissions(newRole.id);

        // Tạo RoleDto đầy đủ (nên dùng RoleMapper.fromModelToDto)
        // TẠM THỜI: Gán trực tiếp vì không có RoleFullModel ở đây
        res.role = {
          id: newRole.id,
          fullname: newRole.fullname,
          shortname: newRole.shortname,
          childRoles: [], // Dữ liệu phân cấp cần được map từ kết quả aggregatedRole
          parentRoles: [], // Dữ liệu phân cấp cần được map từ kết quả aggregatedRole
          users: [],
          permissions: aggregatedPermissions, // Sử dụng quyền đã tổng hợp
        } as RoleDto; // Giả định RoleDto được khởi tạo
        return res;
      } catch (error) {
        res.pushError({ key: 'global', value: 'Unidentified errors' });
        return res;
      }
    });
  }

  // --- UPDATE OPERATION (Thêm logic quản lý Permission và Hierarchy) ---

  async update(id: number, data: UpdateRoleDto): Promise<ResponseRoleDto> {
    const {
      permissions: permissionIds, // Toàn bộ danh sách Permissions mới
      parentRoles: parentRoleIds, // Toàn bộ danh sách Parent Roles mới
      ...updateData
    } = data;
    const res = new ResponseRoleDto();

    // 1. KIỂM TRA XUNG ĐỘT (Pre-check validation)
    // ... (Logic này giữ nguyên, vì nó kiểm tra các trường cơ bản: fullname, shortname)
    if (updateData.fullname || updateData.shortname) {
      // ... (Logic kiểm tra xung đột và thoát sớm nếu có lỗi)
      const existedRole = await this.prisma.role.findMany({
        where: {
          id: { not: id },
          OR: [
            ...(updateData.fullname ? [{ fullname: updateData.fullname }] : []),
            ...(updateData.shortname
              ? [{ shortname: updateData.shortname }]
              : []),
          ],
        },
      });

      if (existedRole.length > 0) {
        if (
          updateData.fullname &&
          existedRole.some((r) => r.fullname === updateData.fullname)
        ) {
          res.pushError({ key: 'fullname', value: 'Fullname existed' });
        }
        if (
          updateData.shortname &&
          existedRole.some((r) => r.shortname === updateData.shortname)
        ) {
          res.pushError({ key: 'shortname', value: 'Shortname existed' });
        }
        if (res.errors.length > 0) {
          return res;
        }
      }
    }
    let basicRoleData: RoleDto = new RoleDto();
    // 2. THỰC HIỆN TRANSACTION (UPDATE)
    await this.prisma
      .$transaction(async (tx) => {
        // 2.1. Đồng bộ hóa Permission (SYNC: DISCONNECT ALL + CONNECT NEW)
        if (permissionIds) {
          // Chỉ thực hiện nếu mảng permissions được cung cấp
          const newConnectPermissions = permissionIds.map((pid) => ({
            id: pid,
          }));

          await tx.role.update({
            where: { id },
            data: {
              permissions: {
                set: newConnectPermissions, // Lệnh 'set' tự động xóa cũ và thêm mới
              },
            },
          });
        }

        // 2.2. Đồng bộ hóa Role Hierarchy (SYNC: DELETE ALL + CREATE NEW)
        if (parentRoleIds) {
          // Chỉ thực hiện nếu mảng parentRoles được cung cấp
          // Xóa tất cả các liên kết cha hiện có của Role này
          await tx.roleHierarchy.deleteMany({
            where: { childId: id },
          });

          // Tạo lại các liên kết cha mới
          if (parentRoleIds.length > 0) {
            const newHierarchies = parentRoleIds.map((parentId) => ({
              parentId,
              childId: id,
            }));
            await tx.roleHierarchy.createMany({
              data: newHierarchies,
              skipDuplicates: true,
            });
          }
        }

        // 2.3. Cập nhật các trường cơ bản của Role
        const updatedRole = await tx.role.update({
          where: { id },
          data: updateData,
          // Lấy các trường cơ bản cần thiết cho RoleDto
          select: {
            id: true,
            fullname: true,
            shortname: true,
            users: true,
            childRoles: {
              include: {
                child: true,
              },
            },
            parentRoles: {
              include: {
                parent: true,
              },
            },
            // Không cần select quan hệ ở đây
          },
        });
        basicRoleData = {
          id: updatedRole.id,
          fullname: updatedRole.fullname,
          shortname: updatedRole.shortname,
          childRoles: updatedRole.childRoles.map((role) => role.child),
          parentRoles: updatedRole.parentRoles.map((role) => role.parent),
          users: updatedRole.users,
          permissions: [],
        };
        return 'success';
      })
      .catch((error) => {
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
          if (error.code === 'P2025') {
            res.pushError({
              key: 'global',
              value: `Role with ID ${id} not found.`,
            });
          }
          if (error.code === 'P2003') {
            res.pushError({
              key: 'global',
              value: 'One or more related resources were not found.',
            });
          }
        } else {
          res.pushError({
            key: 'global',
            value: 'Unidentified errors: ' + error,
          });
        }
        throw error;
      });
    if (res.errors.length > 0) {
      return res;
    }
    // 3. Lấy dữ liệu và Map (Sau khi transaction thành công)
    // Sửa tên hàm để lấy Role đầy đủ và Permissions tổng hợp
    const updatedPermissions =
      await this.roleRepository.getAggregatedPermissions(id);

    // Trả về DTO thành công
    res.role.permissions = updatedPermissions;

    return res;
  }

  // --- DELETE OPERATION (Giữ nguyên) ---

  async delete(id: number): Promise<ResponseRoleDto> {
    const res = new ResponseRoleDto();
    try {
      const data = await this.roleRepository.delete(id);
      if (!data) {
        res.pushError({
          key: 'global',
          value: `Cannot delete role with id ${id}`,
        });
      }
      return res;
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        res.pushError({
          key: 'global',
          value: `Role with ID ${id} not found.`,
        });
        return res;
      }
      res.pushError({
        key: 'global',
        value: `Unexpected Errors: ${error}.`,
      });
      return res;
    }
  }
}
