// repositories/PermissionRepository.ts
import {prisma} from "@/lib/prisma";

export class PermissionRepository {
    async findAll() {
        return prisma.permission.findMany();
    }

    async findById(id: number) {
        return prisma.permission.findUnique({where: {id}});
    }

    async create(data: { name: string; description?: string }) {
        return prisma.permission.create({data});
    }

    async update(id: number, data: { name?: string; description?: string }) {
        return prisma.permission.update({
            where: {id},
            data,
        });
    }

    async delete(id: number) {
        return prisma.permission.delete({where: {id}});
    }
}
