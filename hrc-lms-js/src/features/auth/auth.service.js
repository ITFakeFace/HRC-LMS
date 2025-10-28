// features/auth/auth.service.js
import authRepo from './auth.repository.js';
import crypto from 'node:crypto';
import bcrypt from 'bcrypt';
import {generateAuthTokens} from "@/features/auth/jwt.service.js";
import {LONG_REFRESH_TOKEN_EXPIRATION, SHORT_REFRESH_TOKEN_EXPIRATION} from "@/utils/constants.js";
import LoginSchema from "@/features/auth/auth.schema.js";

const SALT_ROUNDS = process.env.SALT_ROUNDS;

class AuthService {
    /**
     * Tạo Payload cho JWT bằng cách xử lý dữ liệu thô từ Repository.
     * @param {number} userId - ID nội bộ của người dùng.
     * @returns {Promise<object | null>} Payload đã được định dạng (sub, roles, permissions).
     */
    async getUserFullPayload(userId) {
        // 1. GỌI REPOSITORY: Lấy dữ liệu thô từ CSDL
        const user = await authRepo.findUserWithRolesAndPermissions(userId);

        if (!user) {
            return null;
        }

        // 2. LOGIC NGHIỆP VỤ: Xử lý và định dạng dữ liệu (Tạo danh sách độc nhất)
        const roles = user.userRoles.map(ur => ur.role.shortname);
        const permissions = Array.from(
            new Set(
                user.userRoles
                    .flatMap(ur => ur.role.rolePermissions)
                    .map(rp => rp.permission.name)
            )
        );

        // 3. TẠO PAYLOAD CUỐI CÙNG
        return {
            sub: user.id.toString(), // Subject là user ID
            roles: roles,
            permissions: permissions,
            // ...
        };
    }

    // ... Các hàm nghiệp vụ khác (login, register, generateAuthTokens, verifyJwt)
    async login(loginData, ipAddress, userAgent) {
        // 1. VALIDATE & PARSE: Kiểm tra đầu vào bằng Zod
        // SỬ DỤNG .safeParse() hoặc .parse() Tùy thuộc vào cách bạn muốn xử lý lỗi Zod.
        // Dùng .parse() sẽ ném ra ZodError nếu validation thất bại.
        const validatedData = LoginSchema.parse(loginData);
        const { identifier, password, rememberMe } = validatedData;

        // 2. GỌI REPOSITORY: Tìm người dùng theo identifier (Giả sử identifier là email)
        // **LƯU Ý:** Cần cập nhật authRepo.findUserByEmail để xử lý 'identifier' (username/email).
        // Trong ví dụ này, ta giả định identifier là email.
        const user = await authRepo.findUserByEmail(identifier);

        // 3. LOGIC NGHIỆP VỤ: Kiểm tra người dùng có tồn tại không
        if (!user) {
            // Ném lỗi chung để tránh lộ thông tin
            throw new Error('Invalid credentials.');
        }

        // 4. KIỂM TRA MẬT KHẨU
        const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

        if (!isPasswordValid) {
            throw new Error('Invalid credentials.');
        }

        // 5. LOGIC NGHIỆP VỤ: Kiểm tra trạng thái hoạt động (Nếu cần)
        if (user.lockoutEnd != null && user.lockoutEnd > Date.now()) {
            throw new Error('Tải khoản đã bị khóa');
        }

        // 6. THÀNH CÔNG: TẠO VÀ TRẢ VỀ TOKENS
        const tokens = await generateAuthTokens(
            user.id,
            ipAddress,
            userAgent,
            // 🆕 Tùy chỉnh thời gian hết hạn Refresh Token dựa vào 'rememberMe'
            rememberMe
                ? LONG_REFRESH_TOKEN_EXPIRATION
                : SHORT_REFRESH_TOKEN_EXPIRATION
        );

        return {
            userId: user.id,
            email: user.email,
            ...tokens // Chứa { accessToken, refreshToken }
        };
    }
}

module.exports = new AuthService();