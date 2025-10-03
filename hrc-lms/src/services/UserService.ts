import bcrypt from "bcryptjs"; // Lưu ý: Nên dùng thư viện này trong PasswordHasher
import {UserRepository} from "@/repositories/UserRepository";
import {UserCreateDto} from "@/dtos/user/UserCreateDto";
import {UserUpdateDto} from "@/dtos/user/UserUpdateDto";
import {PasswordHasher} from "@/utils/pswHasher";
import {Validator} from "@/utils/validator";
import {UserMapper} from "@/utils/mapper";

export class UserService {
    private repo: UserRepository;

    constructor() {
        this.repo = new UserRepository();
    }

    // -----------------------------
    // Get all users
    // -----------------------------
    async getAllUsers() {
        return this.repo.findAll();
    }

    // -----------------------------
    // Get user by ID
    // -----------------------------
    async getUserById(id: number) {
        return this.repo.findById(id);
    }

    // -----------------------------
    // Create new user
    // -----------------------------
    async createUser(data: UserCreateDto) {
        // 1. Validate
        const errors = await Validator.validateUser(data);
        if (errors.length > 0) return {user: null, errors};

        // 2. Hash password
        const hashedPassword = await PasswordHasher.getHashedPassword(data.password);

        // 3. Chuẩn bị Payload
        const payload: UserCreateDto = {
            ...data,
            password: hashedPassword,

            // Đảm bảo các trường tùy chọn gửi NULL nếu là undefined (cho Prisma)
            phone: data.phone ?? null,
            avatar: data.avatar ?? null,
            lockoutEnd: data.lockoutEnd ?? null,
            isEmailVerified: data.isEmailVerified ?? false,
        };

        // 4. Save
        const user = await this.repo.create(payload);
        return {user, errors: []};
    }


    // -----------------------------
    // Update existing user
    // -----------------------------
    async updateUser(id: string, data: UserUpdateDto) {
        // 1. Chuẩn bị dữ liệu update
        const updatedData: UserUpdateDto = {...data};

        // Gán updatedAt (theo schema, bạn có thể cần set thủ công nếu không dùng `updatedAt` tự động của Prisma)
        updatedData.updatedAt = new Date();

        // 2. Hash mật khẩu mới nếu có
        if (data.password) {
            updatedData.password = await PasswordHasher.getHashedPassword(data.password);
        }

        // 3. Xử lý các trường có thể bị xóa/set null (ví dụ: avatar, phone, lockoutEnd)
        // Đảm bảo client gửi `null` thay vì bỏ qua trường đó nếu muốn xóa giá trị cũ.
        // Tuy nhiên, việc này phụ thuộc vào cách bạn thiết kế UserUpdateDto.
        // Giả sử DTO cho phép các trường optional:

        // 4. Validate dữ liệu update
        // **LƯU Ý:** Tương tự như Create, chỉ cần truyền data đã được chuẩn bị.
        // Cần có logic validate riêng cho Update DTO (ví dụ: password không cần thiết).
        const errors = await Validator.validateUser(updatedData);
        if (errors.length > 0) {
            return {user: null, errors};
        }

        // 5. Update trong repo
        const user = await this.repo.update(Number(id), updatedData);

        return {user, errors: []};
    }

    // -----------------------------
    // Delete user
    // -----------------------------
    async deleteUser(id: number) {
        // 1. Kiểm tra tồn tại trước khi xóa
        const existingUser = await this.repo.findById(id);

        if (!existingUser) {
            return {
                user: null,
                errors: [{key: "id", message: "Không tìm thấy tài khoản để xóa."}]
            };
        }

        // 2. Xóa và trả về kết quả
        // Lưu ý: await là cần thiết để chờ repo.delete hoàn thành
        const deletedUser = await this.repo.delete(id);

        return {user: deletedUser, errors: []};
    }
}