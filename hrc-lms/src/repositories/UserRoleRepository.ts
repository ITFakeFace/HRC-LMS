// src/repositories/UserRoleRepository.ts
import {PrismaClient} from "@prisma/client";
import {UserRoleCreateDto} from "@/dtos/user-role/UserRoleCreateDto";

const prisma = new PrismaClient();

export class UserRoleRepository {
    // Lấy tất cả user-role
    async findAll() {
        return prisma.userRole.findMany({
            include: {
                user: true,
                role: true,
            },
        });
    }

    // Lấy user-role theo userId và roleId
    async findByIds(userId: number, roleId: number) {
        return prisma.userRole.findUnique({
            where: {
                userId_roleId: {
                    userId,
                    roleId,
                },
            },
            include: {
                user: true,
                role: true,
            },
        });
    }

    // Tạo user-role
    async create(data: UserRoleCreateDto) {
        return prisma.userRole.create({
            data: {
                userId: data.userId,
                roleId: data.roleId,
            },
        });
    }

    // Xóa user-role
    async delete(userId: number, roleId: number) {
        return prisma.userRole.delete({
            where: {
                userId_roleId: {
                    userId,
                    roleId,
                },
            },
        });
    }

    // Lấy tất cả role của user
    async findRolesByUserId(userId: number) {
        return prisma.userRole.findMany({
            where: {userId},
            include: {role: true},
        });
    }

    // Lấy tất cả user của role
    async findUsersByRoleId(roleId: number) {
        return prisma.userRole.findMany({
            where: {roleId},
            include: {user: true},
        });
    }
}
