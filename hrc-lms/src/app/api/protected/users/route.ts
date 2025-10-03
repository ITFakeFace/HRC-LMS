import {NextRequest, NextResponse} from "next/server";
import {UserService} from "@/services/UserService";
import {RoleConnectDto, UserCreateDto} from "@/dtos/user/UserCreateDto"; // Cần import DTO
import {ResponseModel} from "@/models/ResponseModel";
import {authorizeRequest} from "@/lib/authorize";

const service = new UserService();

// -----------------------------
// GET: Lấy user theo id (Không thay đổi)
// -----------------------------
async function getUsers(req: NextRequest) {
    try {
        const users = await service.getAllUsers();
        return NextResponse.json(
            ResponseModel.success({
                message: "Thành công!",
                statusCode: 200,
                data: users,
            }),
            {status: 200}
        );
    } catch (err) {
        console.error("GET /users error:", err);
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
// POST: Tạo user mới (ĐÃ SỬA ĐỔI VÀ TỐI ƯU HÓA)
// -----------------------------
async function createUser(req: NextRequest) {
    try {
        const form = await req.formData();

        // Hàm tiện ích để lấy giá trị string từ FormData, trả về null nếu không có
        const getStr = (key: string) => (form.get(key) as string | null);

        // Hàm tiện ích để xử lý các trường tùy chọn DateTime?
        const getOptionalDate = (key: string): Date | null => {
            const raw = getStr(key);
            if (!raw || raw.toLowerCase() === 'null') return null;
            const date = new Date(raw);
            return isNaN(date.getTime()) ? null : date;
        };

        // 1. Xử lý Avatar (Buffer)
        let avatarBuffer: Buffer | null = null;
        const avatarFile = form.get("avatar");
        if (avatarFile && avatarFile instanceof File && avatarFile.size > 0) {
            const bytes = await avatarFile.arrayBuffer();
            avatarBuffer = Buffer.from(bytes);
        }

        // 2. Xử lý Roles (Chuyển chuỗi JSON sang array object)
        let roles: RoleConnectDto[] = []; // Kết quả mong muốn: [{id: number}]
        const rawRolesString = getStr("roles");

        if (rawRolesString) {
            try {
                // Giả định: rawRolesString là chuỗi JSON của mảng object đầy đủ
                const receivedRoles = JSON.parse(rawRolesString);

                if (Array.isArray(receivedRoles)) {
                    roles = receivedRoles
                        // Lọc các object có id và ánh xạ chúng sang RoleConnectDto
                        .filter(r => r && r.id !== undefined)
                        .map(r => ({id: Number(r.id)}));
                }
            } catch (e) {
                console.warn("Lỗi phân tích cú pháp Roles, sử dụng mảng rỗng:", e);
                roles = [];
            }
        }

        // 3. Xây dựng Payload (UserCreateDto)
        const body: UserCreateDto = {
            pID: getStr("pID") as string,
            username: getStr("username") as string,
            phone: getStr("phone"), // Có thể là string hoặc null
            email: getStr("email") as string,
            password: getStr("password") as string,
            fullname: getStr("fullname") as string,

            // Chuyển đổi từ string "true"/"false" sang boolean
            gender: getStr("gender") === "true",
            isEmailVerified: getStr("isEmailVerified") === "true",

            // Chuyển đổi từ string sang Date
            dob: new Date(getStr("dob") as string),

            // Xử lý các trường optional
            lockoutEnd: getOptionalDate("lockoutEnd"),
            avatar: avatarBuffer,

            // Gán roles
            roles: roles // Giả định DTO dùng roles: {id: number}[]
        };

        // console.log("Payload:", body);

        const {user, errors} = await service.createUser(body);

        if (errors && errors.length > 0) { // Kiểm tra errors tồn tại và có phần tử
            return NextResponse.json(
                ResponseModel.error({
                    message: "Validation failed",
                    statusCode: 400,
                    data: errors
                }),
                {status: 400}
            );
        }

        // Loại bỏ trường avatar (Buffer) khỏi response nếu có
        const {avatar, password, ...userWithoutAvatar} = user;

        return NextResponse.json(
            ResponseModel.success({
                message: "User created",
                statusCode: 201,
                data: userWithoutAvatar
            }),
            {status: 201}
        );
    } catch (err) {
        console.error("Create user error:", err);
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
// PUT: Cập nhật user theo id (Cần cập nhật để xử lý FormData nếu có avatar/file update)
// -----------------------------
async function updateUser(req: NextRequest) {
    // Nếu bạn không cho phép update avatar/file/roles qua PUT này,
    // thì logic await req.json() là đủ.

    // Nếu bạn cho phép update bằng JSON body:
    try {
        const body = await req.json();

        // Cần truyền id vào service:
        // Lấy ID từ body hoặc Query Params (tùy vào cách định tuyến của bạn)
        // Giả định ID được truyền trong body: body.id

        // Nếu không có id, không thể update
        if (!body.id) {
            return NextResponse.json(ResponseModel.error({
                message: "Missing ID for update",
                statusCode: 400,
                data: null,
            }), {status: 400});
        }

        const {user, errors} = await service.updateUser(String(body.id), body);

        if (errors && errors.length > 0) {
            return NextResponse.json(ResponseModel.error({
                message: "Có lỗi xảy ra",
                statusCode: 400, // Thường là 400 nếu lỗi từ Service
                data: errors,
            }), {status: 400});
        }

        return NextResponse.json(ResponseModel.success({
            message: "Thành công!",
            data: user
        }), {status: 200});
    } catch (err) {
        console.error("PUT /users error:", err);
        return NextResponse.json(ResponseModel.error({
            message: "Internal Server Error",
            statusCode: 500,
            data: err,
        }), {status: 500});
    }
}

// -----------------------------
// DELETE: Xóa user theo id
// -----------------------------
async function deleteUser(req: NextRequest) {
    try {
        const body = await req.json();

        // Kiểm tra body.id
        if (!body.id) {
            return NextResponse.json(ResponseModel.error({
                message: "Missing ID for deletion",
                statusCode: 400,
                data: null,
            }), {status: 400});
        }

        const {user, errors} = await service.deleteUser(Number(body.id));

        if (errors && errors.length > 0) {
            return NextResponse.json(ResponseModel.error({
                message: "Có lỗi xảy ra",
                statusCode: 404, // 404 nếu không tìm thấy user
                data: errors,
            }), {status: 404});
        }

        return NextResponse.json(ResponseModel.success({
            message: "Xoá thành công!",
            data: user
        }), {status: 200});
    } catch (err) {
        console.error("DELETE /users error:", err);
        return NextResponse.json(ResponseModel.error({
            message: "Internal Server Error",
            statusCode: 500,
            data: err,
        }), {status: 500});
    }
}

export const GET = authorizeRequest(getUsers, "MANAGE_USERS")
export const POST = authorizeRequest(createUser, "MANAGE_USERS")
export const PUT = authorizeRequest(updateUser, "MANAGE_USERS")
export const DELETE = authorizeRequest(deleteUser, "MANAGE_USERS")