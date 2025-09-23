import {NextRequest, NextResponse} from "next/server";
import {UserService} from "@/services/UserService";
import {ResponseModel} from "@/models/ResponseModel";
import {authorizeRequest} from "@/lib/authorize";

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
        const userId = Number(params.id);
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
const updateUser = async (
    req: NextRequest,
    userId: string,
    params: { id: string }
) => {
    try {
        const body = await req.json();

        const {user, errors} = await service.updateUser(params.id, body);

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
                message: "Cập nhật thành công!",
                data: user,
            }),
            {status: 200}
        );
    } catch (err) {
        console.error("PUT /users/[id] error:", err);
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
