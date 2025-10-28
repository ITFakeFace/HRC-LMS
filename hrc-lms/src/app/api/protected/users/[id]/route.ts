import {NextRequest, NextResponse} from "next/server";
import {UserService} from "@/services/UserService";
import {ResponseModel} from "@/models/ResponseModel";
import {authorizeRequest} from "@/lib/authorize";
import {RoleConnectDto} from "@/dtos/user/UserCreateDto";
import {UserUpdateDto} from "@/dtos/user/UserUpdateDto";

const service = new UserService();

// -----------------------------
// GET: Lấy user theo id
// -----------------------------
const getUserById = async (
    req: NextRequest,
    userId: string,
    params: { id: string }
) => {
    try {
        const {id} = await params;
        const userId = Number(id);
        const user = await service.getUserById(userId);

        if (!user) {
            return NextResponse.json(
                ResponseModel.error({
                    message: "User not found",
                    statusCode: 404,
                    data: null,
                }),
                {status: 404}
            );
        }

        return NextResponse.json(
            ResponseModel.success({
                message: "Thành công!",
                statusCode: 200,
                data: user,
            }),
            {status: 200}
        );
    } catch (err) {
        console.error("GET /users/[id] error:", err);
        return NextResponse.json(
            ResponseModel.error({
                message: "Internal Server Error",
                statusCode: 500,
                data: err,
            }),
            {status: 500}
        );
    }
}

// -----------------------------
// PUT: Cập nhật user theo id
// -----------------------------
// Hàm tiện ích để lấy giá trị string từ FormData, trả về null nếu không có
const getStr = (form: FormData, key: string) => (form.get(key) as string | null);

// Hàm tiện ích để xử lý các trường tùy chọn DateTime?
const getOptionalDate = (form: FormData, key: string): Date | null => {
    const raw = getStr(form, key);
    if (!raw || raw.toLowerCase() === 'null') return null;
    const date = new Date(raw);
    return isNaN(date.getTime()) ? null : date;
};


// -----------------------------
// PUT: Cập nhật user theo ID
// -----------------------------
const updateUser = async (
    req: NextRequest,
    userId: string,
    params: { id: string }
) => {
    const {id} = await params;
    console.log("\n\nUpdate User\n\n");
    try {
        // 1. Lấy dữ liệu FormData (multipart/form-data)
        const form = await req.formData();

        // 2. Xử lý Avatar (Buffer)
        let avatarBuffer: Buffer | null | undefined = undefined; // undefined: không cập nhật; null: xóa avatar cũ
        const avatarFile = form.get("avatar");

        if (avatarFile && avatarFile instanceof File && avatarFile.size > 0) {
            // Có file mới được tải lên
            const bytes = await avatarFile.arrayBuffer();
            avatarBuffer = Buffer.from(bytes);
        } else if (avatarFile === 'null') {
            // Giả sử client gửi "null" string nếu muốn xóa avatar cũ
            avatarBuffer = null;
        }
        // Nếu avatarFile là null/undefined hoặc file rỗng, avatarBuffer là undefined (không cập nhật)

        // 3. Xử lý Roles (Chuyển chuỗi JSON sang array object)
        // Lưu ý: MultiSelect của PrimeReact gửi mảng số (Role IDs) sang backend,
        // nếu bạn đang sử dụng FormData và không xử lý đặc biệt, nó sẽ gửi nhiều cặp key=value.
        // Tuy nhiên, dựa trên code tạo (createUser) của bạn, tôi giữ logic xử lý chuỗi JSON:
        let roles: RoleConnectDto[] | undefined = undefined; // undefined: không cập nhật
        const rawRolesString = getStr(form, "roles");

        if (rawRolesString) {
            try {
                const receivedRoles = JSON.parse(rawRolesString);

                if (Array.isArray(receivedRoles)) {
                    roles = receivedRoles
                        .filter(r => r && r.id !== undefined)
                        .map(r => ({id: Number(r.id)}));
                } else {
                    // Nếu là mảng ID: [1, 2, 3]
                    roles = receivedRoles.map(id => ({id: Number(id)}));
                }

            } catch (e) {
                console.warn("Lỗi phân tích cú pháp Roles, bỏ qua cập nhật Roles:", e);
                roles = undefined;
            }
        }

        // 4. Xây dựng Payload (UserUpdateDto)
        const body: UserUpdateDto = {
            // Các trường bắt buộc trong UserCreateDto sẽ là tùy chọn trong UserUpdateDto
            pID: getStr(form, "pID") as string,
            username: getStr(form, "username") as string,
            phone: getStr(form, "phone"),
            email: getStr(form, "email") as string,

            // Password chỉ cập nhật nếu có giá trị
            password: getStr(form, "password") || undefined,

            fullname: getStr(form, "fullname") as string,

            // Chuyển đổi từ string "true"/"false" sang boolean
            gender: getStr(form, "gender") ? getStr(form, "gender") === "true" : undefined,
            isEmailVerified: getStr(form, "isEmailVerified") ? getStr(form, "isEmailVerified") === "true" : undefined,

            // Chuyển đổi từ string sang Date
            dob: getStr(form, "dob") ? new Date(getStr(form, "dob") as string) : undefined,

            // Xử lý các trường optional
            lockoutEnd: getOptionalDate(form, "lockoutEnd"),
            avatar: avatarBuffer, // undefined, null hoặc Buffer

            // Gán roles
            roles: roles // undefined hoặc RoleConnectDto[]
        };

        // Loại bỏ các trường undefined để Prisma/Service không cố gắng cập nhật chúng
        Object.keys(body).forEach(key => body[key] === undefined && delete body[key]);

        const {user, errors} = await service.updateUser(id, body);

        if (errors && errors.length > 0) {
            return NextResponse.json(
                ResponseModel.error({
                    message: "Cập nhật thất bại do lỗi validation",
                    statusCode: 400,
                    data: errors,
                }),
                {status: 400}
            );
        }

        // Loại bỏ trường avatar (Buffer) và password khỏi response nếu có
        const {avatar, password, ...userWithoutAvatar} = user;

        return NextResponse.json(
            ResponseModel.success({
                message: "Cập nhật thành công!",
                data: userWithoutAvatar,
            }),
            {status: 200}
        );
    } catch (err) {
        console.error(`PUT /users/${id} error:`, err);
        return NextResponse.json(
            ResponseModel.error({
                message: "Internal Server Error",
                statusCode: 500,
                data: err,
            }),
            {status: 500}
        );
    }
}

// -----------------------------
// DELETE: Xóa user theo id
// -----------------------------
const deleteUser = async (
    req: NextRequest,
    userId: string,
    params: { id: string }
) => {
    try {
        const userId = Number(params.id);
        const {user, errors} = await service.deleteUser(userId);

        if (errors.length > 0) {
            return NextResponse.json(
                ResponseModel.error({
                    message: "Có lỗi xảy ra",
                    statusCode: 400,
                    data: errors,
                }),
                {status: 400}
            );
        }

        return NextResponse.json(
            ResponseModel.success({
                message: "Xoá thành công!",
                data: user,
            }),
            {status: 200}
        );
    } catch (err) {
        console.error("DELETE /users/[id] error:", err);
        return NextResponse.json(
            ResponseModel.error({
                message: "Internal Server Error",
                statusCode: 500,
                data: err,
            }),
            {status: 500}
        );
    }
}

// Export theo chuẩn Next.js App Router
export const GET = authorizeRequest(getUserById, "MANAGE_USERS");
export const PUT = authorizeRequest(updateUser, "MANAGE_USERS");
export const DELETE = authorizeRequest(deleteUser, "MANAGE_USERS");
