// features/auth/auth.repository.js
import prisma from '@/libs/prisma';

class AuthRepository {
    /**
     * Lấy thông tin người dùng cùng với tất cả Roles và Permissions lồng nhau.
     * @param {number} userId - ID nội bộ của người dùng.
     * @returns {Promise<object | null>} Dữ liệu người dùng thô từ Prisma.
     */
    async findUserWithRolesAndPermissions(userId) {
        return prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                userRoles: {
                    select: {
                        role: {
                            select: {
                                shortname: true,
                                rolePermissions: {
                                    select: {
                                        permission: {
                                            select: {
                                                name: true,
                                            },
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
            },
        });
    }

    // ... Các hàm truy vấn database khác (ví dụ: tìm user theo email, tạo refresh token, v.v.)
    async findUserByEmail(email) {
        return prisma.user.findUnique({
            where: { email: email },
            // Cần select thêm mật khẩu để kiểm tra đăng nhập
            select: {
                id: true,
                email: true,
                password: true, // Giả sử cột mật khẩu là 'passwordHash'
                lockoutEnd: true,
            }
        });
    }

    async createUser(email, passwordHash) {
        return prisma.user.create({
            data: {
                email: email,
                password: password,
                // ... Các trường mặc định khác (ví dụ: tên, trạng thái kích hoạt)
                // Giả sử có thêm bước gán Role mặc định nếu cần
            },
            select: {
                id: true,
                email: true,
                // Không select mật khẩu trở lại
            }
        });
    }
}

module.exports = new AuthRepository();