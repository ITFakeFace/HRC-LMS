// src/repositories/RoleHierarchyRepository.ts
import {PrismaClient} from "@prisma/client";
import {RoleHierarchyCreateDto} from "@/dtos/role-hierarchy/RoleHierarchyCreateDto";

const prisma = new PrismaClient();

export class RoleHierarchyRepository {
    // Lấy tất cả quan hệ role
    async findAll() {
        return prisma.roleHierarchy.findMany({
            include: {
                parent: true,
                child: true,
            },
        });
    }

    // Lấy quan hệ cụ thể (parentId - childId)
    async findByIds(parentId: number, childId: number) {
        return prisma.roleHierarchy.findUnique({
            where: {
                parentId_childId: {
                    parentId,
                    childId,
                },
            },
            include: {
                parent: true,
                child: true,
            },
        });
    }

    // Tạo quan hệ role (cha - con)
    async create(data: RoleHierarchyCreateDto) {
        return prisma.roleHierarchy.create({
            data: {
                parentId: data.parentId,
                childId: data.childId,
            },
        });
    }

    // Xóa quan hệ role (cha - con)
    async delete(parentId: number, childId: number) {
        return prisma.roleHierarchy.delete({
            where: {
                parentId_childId: {
                    parentId,
                    childId,
                },
            },
        });
    }
}
