// src/repositories/RoleRepository.ts

import {PrismaClient, Prisma} from "@prisma/client";
import {RoleCreateDto} from "@/dtos/role/RoleCreateDto";
import {RoleUpdateDto} from "@/dtos/role/RoleUpdateDto";

// 💡 Giả định bạn sử dụng một instance Prisma singleton (thường là "@/lib/prisma")
// Thay vì new PrismaClient() tại đây, nhưng tôi sẽ giữ lại new PrismaClient() theo code của bạn.
const prisma = new PrismaClient();

// Định nghĩa cấu trúc include chung để tái sử dụng
const roleInclude = {
    parentRoles: {include: {parent: true}},
    childRoles: {include: {child: true}},
    rolePermissions: {include: {permission: true}}, // Thêm include permission để có chi tiết quyền
};

// Định nghĩa kiểu dữ liệu trả về cho các phương thức
type RoleWithRelations = Prisma.RoleGetPayload<{ include: typeof roleInclude }>;


export class RoleRepository {

    // -----------------------------
    // Tìm tất cả Roles
    // -----------------------------
    async findAll(): Promise<RoleWithRelations[]> {
        return prisma.role.findMany({
            include: roleInclude,
        });
    }

    // -----------------------------
    // Tìm Role bằng ID
    // -----------------------------
    async findById(id: number): Promise<RoleWithRelations | null> {
        return prisma.role.findUnique({
            where: {id},
            include: roleInclude,
        });
    }

    // -----------------------------
    // TẠO ROLE + THIẾT LẬP QUAN HỆ (Transactional)
    // -----------------------------
    async createRoleWithRelations(data: RoleCreateDto): Promise<RoleWithRelations> {
        return prisma.$transaction(async (tx) => {

            // A. TẠO ROLE CƠ BẢN
            const newRole = await tx.role.create({
                data: {
                    fullname: data.fullname,
                    shortname: data.shortname,
                },
            });

            // B. THIẾT LẬP QUAN HỆ ROLES CHA (RoleHierarchy)
            if (data.parentRoles && data.parentRoles.length > 0) {
                const hierarchyData = data.parentRoles
                    // Loại bỏ tự tham chiếu
                    .filter(parentId => parentId !== newRole.id)
                    .map(parentId => ({
                        parentId: parentId,
                        childId: newRole.id,
                    }));

                if (hierarchyData.length > 0) {
                    await tx.roleHierarchy.createMany({
                        data: hierarchyData,
                        skipDuplicates: true,
                    });
                }
            }

            // C. THIẾT LẬP QUAN HỆ QUYỀN (RolePermission)
            if (data.permissions && data.permissions.length > 0) {
                const permissionData = data.permissions.map(permissionId => ({
                    roleId: newRole.id,
                    permissionId: permissionId,
                }));

                await tx.rolePermission.createMany({
                    data: permissionData,
                    skipDuplicates: true,
                });
            }

            // Trả về role hoàn chỉnh
            return await tx.role.findUniqueOrThrow({
                where: {id: newRole.id},
                include: roleInclude, // Sử dụng include đã định nghĩa
            });
        });
    }

    // -----------------------------
    // Cập nhật Role (Giữ nguyên, không kèm quan hệ phức tạp)
    // -----------------------------
    async update(id: number, data: RoleUpdateDto): Promise<RoleWithRelations> {
        return prisma.role.update({
            where: {id},
            data,
            include: roleInclude, // Trả về đầy đủ quan hệ sau khi update
        });
    }

    // -----------------------------
    // Xóa Role
    // -----------------------------
    async delete(id: number): Promise<RoleWithRelations> {
        // Do dùng onDelete: Cascade, các quan hệ sẽ tự động xóa
        return prisma.role.delete({
            where: {id},
            include: roleInclude, // Trả về đầy đủ quan hệ trước khi xóa (Prisma trả về đối tượng đã xóa)
        });
    }

    // 💡 Phương thức create(data: RoleCreateDto) cũ đã bị loại bỏ/thay thế bằng createRoleWithRelations
}