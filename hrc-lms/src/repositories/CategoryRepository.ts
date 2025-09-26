// CategoryRepository.ts
import {PrismaClient} from "@prisma/client";
import {CategoryDto} from "@/dtos/category/CategoryDto";
import {CategoryCreateDto} from "@/dtos/category/CategoryCreateDto";
import {CategoryUpdateDto} from "@/dtos/category/CategoryUpdateDto";

const prisma = new PrismaClient();

export class CategoryRepository {
    async findAll(): Promise<CategoryDto[]> {
        const categories = await prisma.category.findMany();
        return categories.map(c => ({
            id: c.id,
            name: c.name,
            description: c.description ?? null,
        }));
    }

    async findById(id: number): Promise<CategoryDto | null> {
        const c = await prisma.category.findUnique({where: {id}});
        if (!c) return null;
        return {
            id: c.id,
            name: c.name,
            description: c.description ?? null,
        };
    }

    async create(data: CategoryCreateDto): Promise<CategoryDto> {
        const c = await prisma.category.create({
            data: {
                name: data.name,
                description: data.description ?? null,
            },
        });
        return {
            id: c.id,
            name: c.name,
            description: c.description ?? null,
        };
    }

    async update(data: CategoryUpdateDto): Promise<CategoryDto | null> {
        const c = await prisma.category.update({
            where: {id: data.id},
            data: {
                name: data.name,
                description: data.description,
            },
        });
        return {
            id: c.id,
            name: c.name,
            description: c.description ?? null,
        };
    }

    async delete(id: number): Promise<CategoryDto | null> {
        const c = await prisma.category.delete({where: {id}});
        return {
            id: c.id,
            name: c.name,
            description: c.description ?? null,
        };
    }
}
