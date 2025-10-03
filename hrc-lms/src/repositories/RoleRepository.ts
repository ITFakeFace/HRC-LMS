// src/repositories/RoleRepository.ts
import {PrismaClient} from "@prisma/client";
import {RoleCreateDto} from "@/dtos/role/RoleCreateDto";
import {RoleUpdateDto} from "@/dtos/role/RoleUpdateDto";

const prisma = new PrismaClient();

export class RoleRepository {
    async findAll() {
        return prisma.role.findMany({
            include: {
                parentRoles: {include: {parent: true}},
                childRoles: {include: {child: true}},
                rolePermissions: true,
            },
        });
    }

    async findById(id: number) {
        return prisma.role.findUnique({
            where: {id},
            include: {
                parentRoles: {include: {parent: true}},
                childRoles: {include: {child: true}},
                rolePermissions: true,
            },
        });
    }

    async create(data: RoleCreateDto) {
        return prisma.role.create({
            data: {
                ...data,
            },
        });
    }

    async update(id: number, data: RoleUpdateDto) {
        return prisma.role.update({
            where: {id},
            data,
        });
    }

    async delete(id: number) {
        return prisma.role.delete({
            where: {id},
        });
    }
}
