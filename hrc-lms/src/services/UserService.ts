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
        // 1. Chuẩn bị dữ liệu update (Tạo bản sao để chỉnh sửa)
        const updatedData: UserUpdateDto = {...data};

        // Gán updatedAt (theo schema, bạn có thể cần set thủ công nếu không dùng `updatedAt` tự động của Prisma)
        updatedData.updatedAt = new Date();

        // 2. Xử lý Mật khẩu: Chỉ hash và cập nhật nếu có giá trị
        if (updatedData.password) {
            // Nếu có password được gửi, hash nó
            updatedData.password = await PasswordHasher.getHashedPassword(updatedData.password);
        } else {
            // Nếu password là rỗng ("") hoặc undefined, loại bỏ trường này khỏi payload
            // Điều này đảm bảo mật khẩu cũ KHÔNG bị thay thế hoặc cập nhật lại
            delete updatedData.password;
        }

        // 3. Xử lý các trường tùy chọn (Nullable Fields)
        // Đảm bảo các trường này được gửi `null` nếu client muốn xóa/bỏ đặt giá trị cũ.
        // Nếu các trường này là `undefined` (không gửi từ client), chúng sẽ bị bỏ qua (không cập nhật).
        // Nếu client gửi `null`, chúng sẽ được cập nhật thành `null`.

        if (updatedData.phone === "") {
            updatedData.phone = null;
        }
        updatedData.phone = updatedData.phone ?? undefined; // undefined: giữ nguyên, null: xóa

        updatedData.avatar = updatedData.avatar ?? undefined; // undefined: giữ nguyên, Buffer/null: cập nhật

        if ((updatedData.lockoutEnd as any) === "") {
            updatedData.lockoutEnd = null;
        }
        updatedData.lockoutEnd = updatedData.lockoutEnd ?? undefined; // undefined: giữ nguyên, Date/null: cập nhật

        // 4. Validate dữ liệu update
        // **LƯU Ý:** Bạn cần một Validator chuyên dụng cho Update,
        // nơi các trường không bắt buộc (như password, email nếu bạn không cho sửa) không bị lỗi.
        // Tôi giả định Validator.validateUser có thể xử lý DTO Partial.
        const errors = await Validator.validateUser(updatedData);
        if (errors.length > 0) {
            return {user: null, errors};
        }

        // 5. Update trong repo
        // Lọc các trường là `undefined` trước khi gửi đi để tránh xung đột với Prisma.
        // Nếu bạn đang dùng `updatedData` (là UserUpdateDto), việc lọc này thường được xử lý ở Repo/Prisma.
        // Nhưng để an toàn, ta có thể lọc các trường là undefined nếu DTO/Repo không xử lý tốt.

        const finalPayload = Object.fromEntries(
            Object.entries(updatedData).filter(([, value]) => value !== undefined)
        ) as UserUpdateDto;

        const user = await this.repo.update(Number(id), finalPayload);

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