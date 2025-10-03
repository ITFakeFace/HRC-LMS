import {PrismaClient} from "@prisma/client";
import {RolePermissionCreateDto} from "@/dtos/role-permission/RolePermissionCreateDto";

const prisma = new PrismaClient();

export class RolePermissionRepository {
    // Gán quyền vào role
    async add(data: RolePermissionCreateDto) {
        return prisma.rolePermission.create({
            data: {
                roleId: data.roleId,
                permissionId: data.permissionId,
            },
            include: {
                role: true,
                permission: true,
            },
        });
    }

    // Gỡ quyền khỏi role
    async remove(roleId: number, permissionId: number) {
        return prisma.rolePermission.delete({
            where: {
                roleId_permissionId: {roleId, permissionId},
            },
            include: {
                role: true,
                permission: true,
            },
        });
    }

    // Tìm theo Role
    async findByRole(roleId: number) {
        return prisma.rolePermission.findMany({
            where: {roleId},
            include: {permission: true},
        });
    }

    // Tìm theo Permission
    async findByPermission(permissionId: number) {
        return prisma.rolePermission.findMany({
            where: {permissionId},
            include: {role: true},
        });
    }

    // Kiểm tra đã tồn tại chưa
    async exists(roleId: number, permissionId: number) {
        return prisma.rolePermission.findUnique({
            where: {
                roleId_permissionId: {roleId, permissionId},
            },
        });
    }
}
