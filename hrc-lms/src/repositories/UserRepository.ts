import {PrismaClient} from "@prisma/client";
import {UserCreateDto} from "@/dtos/user/UserCreateDto";
import {UserUpdateDto} from "@/dtos/user/UserUpdateDto";

const prisma = new PrismaClient();

export class UserRepository {
    async findAll() {
        return prisma.user.findMany({
            include: {userRoles: {include: {role: true}}},
        });
    }

    async findById(id: number) {
        return prisma.user.findUnique({
            where: {id},
            include: {userRoles: {include: {role: true}}},
        });
    }

    async create(data: UserCreateDto) {
        return prisma.user.create({
            data: {
                ...data,
                updatedAt: new Date(),
            }
        });
    }

    async update(id: number, data: UserUpdateDto) {
        return prisma.user.update({
            where: {id},
            data,
        });
    }

    async delete(id: number) {
        return prisma.user.delete({where: {id}});
    }
}
