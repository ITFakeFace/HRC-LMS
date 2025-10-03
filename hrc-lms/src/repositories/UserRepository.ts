import {PrismaClient, Prisma} from "@prisma/client";
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
        const user = await prisma.user.findUnique({
            where: {id},
            include: {userRoles: {include: {role: true}}},
        });

        if (!user) return null;

        return {
            ...user,
            avatar: user.avatar
                ? `data:image/png;base64,${Buffer.from(user.avatar).toString("base64")}`
                : null,
        };
    }

    /**
     * ✅ Tối ưu hóa: Dùng spread operator, loại bỏ createdAt/updatedAt thủ công,
     * và dùng roleIds để tạo quan hệ UserRole.
     */
    async create(data: UserCreateDto) {
        // Tách roles ra khỏi data để không truyền trực tiếp vào user.create
        const {roles, ...userData} = data;

        // Bắt buộc dùng transaction để đảm bảo toàn vẹn dữ liệu
        return prisma.$transaction(async (tx) => {

            const newUser = await tx.user.create({
                data: {
                    ...userData,

                    // Đảm bảo các trường tùy chọn nhận giá trị null nếu undefined/null
                    phone: userData.phone ?? null,
                    lockoutEnd: userData.lockoutEnd ?? null,
                    avatar: userData.avatar ?? null,
                    isEmailVerified: userData.isEmailVerified ?? false,
                    // Bổ sung updatedAt để thỏa mãn yêu cầu của Prisma
                    updatedAt: new Date(),
                    // Gán roles: Tạo các bản ghi trong bảng liên kết UserRole
                    userRoles: {
                        create: roles.map(role => ({
                            role: {
                                // Dùng connect để liên kết với Role đã tồn tại
                                connect: {id: role}
                            }
                        }))
                    }
                },
                // Include để trả về user kèm thông tin roles
                include: {
                    userRoles: {include: {role: true}}
                }
            });

            return newUser;
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