import {PrismaClient} from '@prisma/client';
import {CourseCreateDto} from "@/dtos/course/CourseCreateDto";
import {CourseUpdateDto} from "@/dtos/course/CourseUpdateDto";

const prisma = new PrismaClient();

export class CourseRepository {
    async getAll() {
        return prisma.course.findMany({
            include: {
                categories: {
                    include: {
                        category: true, // nếu bảng trung gian tên khác thì chỉnh lại
                    },
                },
            },
        });
    }

    async getById(id: number) {
        return prisma.course.findUnique({
            where: {id},
            include: {
                categories: {
                    include: {
                        category: true,
                    },
                },
            },
        });
    }

    async create(data: CourseCreateDto) {
        return prisma.course.create({
            data: {
                name: data.name,
                description: data.description,
                requirements: data.requirements,
                coverImage: data.coverImage,
                courseObjectives: data.courseObjectives,
                targetLearners: data.targetLearners,
                courseDuration: data.courseDuration,
                assessmentMethods: data.assessmentMethods,
                status: data.status ?? 0,
                creatorId: data.creatorId,
                lastEditor: data.lastEditor,
                categories: {
                    create: data.categories.map((categoryId) => ({
                        categoryId,
                    })),
                },
            },
            include: {
                categories: true,
            },
        });
    }

    async update(id: number, data: CourseUpdateDto) {
        // Tách categories ra nếu có
        const {categories, ...rest} = data;

        const updateData: any = {
            ...rest,
            updatedAt: new Date(),
        };

        const updatedCourse = await prisma.course.update({
            where: {id},
            data: updateData,
        });

        if (categories) {
            // Xóa categories cũ
            await prisma.courseCategory.deleteMany({
                where: {courseId: id},
            });

            // Tạo categories mới
            await prisma.courseCategory.createMany({
                data: categories.map((categoryId) => ({
                    courseId: id,
                    categoryId,
                })),
            });
        }

        return this.getById(id);
    }

    async delete(id: number) {
        await prisma.courseCategory.deleteMany({
            where: {courseId: id},
        });

        return prisma.course.delete({
            where: {id},
        });
    }
}
