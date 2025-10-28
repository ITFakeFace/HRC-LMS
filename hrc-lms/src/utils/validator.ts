import {UserDto} from "@/dtos/user/UserDto";
import {prisma} from "@/lib/prisma";
import {RoleDto} from "@/dtos/role/RoleDto";
import {UserCreateDto} from "@/dtos/user/UserCreateDto";
import {UserRoleCreateDto} from "@/dtos/user-role/UserRoleCreateDto";
import {RoleCreateDto} from "@/dtos/role/RoleCreateDto";
import {UserUpdateDto} from "@/dtos/user/UserUpdateDto";

export interface ValidationError {
    key: string;
    message: string;
}

export class Validator {
    /**
     * Xác thực dữ liệu UserCreateDto, bao gồm kiểm tra trùng lặp trong DB.
     * @param data UserCreateDto
     * @returns Mảng lỗi (rỗng nếu hợp lệ)
     */
    static async validateUser(data: UserCreateDto | UserUpdateDto): Promise<ValidationError[]> {
        const errors: ValidationError[] = [];
        const existListCondition: any[] = []; // Điều kiện cho mệnh đề OR trong Prisma

        // --- 1. Kiểm tra các trường bắt buộc (Client-side validation) ---

        if (!data.password || data.password.length < 1) {
            errors.push({key: "password", message: "Mật khẩu không được để trống."});
        }
        if (!data.pID) {
            errors.push({key: "pID", message: "Personal ID không được để trống."});
        }
        if (!data.username) {
            errors.push({key: "username", message: "Tên tài khoản không được để trống."});
        }
        if (!data.email) {
            errors.push({key: "email", message: "Email không được để trống."});
        }

        // Nếu đã có lỗi, không cần kiểm tra DB
        if (errors.length > 0) return errors;

        // --- 2. Chuẩn bị điều kiện kiểm tra trùng lặp (UNIQUE fields) ---

        // Thêm các trường có giá trị vào mệnh đề OR
        existListCondition.push({pID: data.pID});
        existListCondition.push({username: data.username});
        existListCondition.push({email: data.email});

        // Chỉ thêm phone nếu nó có giá trị (không phải null hoặc undefined)
        if (data.phone) {
            existListCondition.push({phone: data.phone});
        }

        // --- 3. Kiểm tra trùng lặp trong cơ sở dữ liệu ---
        const existedData = await prisma.user.findMany({
            where: {
                OR: existListCondition,
            },
            // Chỉ cần chọn các trường cần kiểm tra để tối ưu hóa truy vấn
            select: {
                pID: true,
                username: true,
                email: true,
                phone: true,
            }
        });

        // --- 4. Ghi nhận lỗi trùng lặp ---
        for (const existed of existedData) {
            // Kiểm tra trùng lặp P.ID
            if (existed.pID === data.pID) {
                errors.push({key: "pID", message: "Số CCCD đã được đăng ký."});
            }
            // Kiểm tra trùng lặp Email
            if (existed.email === data.email) {
                errors.push({key: "email", message: "Email đã được đăng ký."});
            }
            // Kiểm tra trùng lặp Username
            if (existed.username === data.username) {
                errors.push({key: "username", message: "Tên tài khoản đã tồn tại."});
            }
            // Kiểm tra trùng lặp Phone (chỉ khi user.phone tồn tại)
            if (data.phone && existed.phone === data.phone) {
                errors.push({key: "phone", message: "Số điện thoại đã tồn tại."});
            }
        }

        return errors;
    }

    // Validator hiện chấp nhận BaseRoleData hoặc DTO đầy đủ
    static async validateRole(data: RoleValidationDto | RoleCreateDto | any) {
        const errors = [];

        // 1. Kiểm tra trường bắt buộc và định dạng cơ bản
        if (!data.fullname || data.fullname.trim() === "") {
            errors.push({key: "fullname", message: "Tên đầy đủ không được để trống."});
        } else if (data.fullname.length > 50) {
            errors.push({key: "fullname", message: "Tên đầy đủ không được vượt quá 50 ký tự."});
        }

        if (!data.shortname || data.shortname.trim() === "") {
            errors.push({key: "shortname", message: "Tên viết tắt không được để trống."});
        } else if (data.shortname.length > 15) {
            errors.push({key: "shortname", message: "Tên viết tắt không được vượt quá 15 ký tự."});
        } else if (!/^[A-Z0-9_]+$/.test(data.shortname)) {
            errors.push({key: "shortname", message: "Tên viết tắt chỉ chấp nhận chữ hoa, số và dấu gạch dưới."});
        }

        return errors;
    }

    static async validateRoleHierarchy(data: any) {
        const errors: { key: string; message: string }[] = [];
        if (!data.parentId) errors.push({key: "parentId", message: "parentId là bắt buộc"});
        if (!data.childId) errors.push({key: "childId", message: "childId là bắt buộc"});
        if (data.parentId === data.childId)
            errors.push({key: "roleHierarchy", message: "parentId và childId không được trùng nhau"});
        return errors;
    }

    /**
     * Validate UserRole data
     * @param dto UserRoleCreateDto
     * @returns mảng lỗi (nếu có), rỗng nếu hợp lệ
     */
    static async validateUserRole(dto: UserRoleCreateDto): Promise<{ key: string; message: string }[]> {
        const errors: { key: string; message: string }[] = [];

        if (!dto.userId || dto.userId <= 0) {
            errors.push({key: "userId", message: "userId không hợp lệ"});
        }

        if (!dto.roleId || dto.roleId <= 0) {
            errors.push({key: "roleId", message: "roleId không hợp lệ"});
        }

        // Nếu muốn, có thể check xem userId và roleId có tồn tại trong DB không
        // const userExists = await UserRepository.findById(dto.userId);
        // const roleExists = await RoleRepository.findById(dto.roleId);
        // if (!userExists) errors.push({ key: "userId", message: "User không tồn tại" });
        // if (!roleExists) errors.push({ key: "roleId", message: "Role không tồn tại" });

        return errors;
    }
}