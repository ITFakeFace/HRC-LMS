import {NextRequest, NextResponse} from "next/server";
import {UserService} from "@/services/UserService";
import {ResponseModel} from "@/models/ResponseModel";
import {authorizeRequest} from "@/lib/authorize";

const service = new UserService();

// -----------------------------
// GET: Lấy user theo id
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

async function createUser(req: NextRequest) {
    try {
        const body = await req.json();
        const {user, errors} = await service.createUser(body);

        if (errors.length > 0) {
            return NextResponse.json(ResponseModel.error({
                message: "Có lỗi xảy ra",
                statusCode: 500,
                data: errors,
            }));
        }

        return NextResponse.json(ResponseModel.success({
            message: "Thành công!",
            data: user
        }));
    } catch (err) {
        console.error("Create user error:", err);
        return NextResponse.json(ResponseModel.error({
            message: "Internal Server Error",
            statusCode: 500,
            data: err,
        }));
    }
}


// -----------------------------
// PUT: Cập nhật user theo id
// -----------------------------
async function updateUser(req: NextRequest) {
    try {
        const body = await req.json();
        const {user, errors} = await service.updateUser(body.id, body);

        if (errors.length > 0) {
            return NextResponse.json(ResponseModel.error({
                message: "Có lỗi xảy ra",
                statusCode: 500,
                data: errors,
            }));
        }

        return NextResponse.json(ResponseModel.success({
            message: "Thành công!",
            data: user
        }));
    } catch (err) {
        console.error("PUT /users error:", err);
        return NextResponse.json(ResponseModel.error({
            message: "Internal Server Error",
            statusCode: 500,
            data: err,
        }));
    }
}

// -----------------------------
// DELETE: Xóa user theo id
// -----------------------------
async function deleteUser(req: NextRequest) {
    try {
        const body = await req.json();
        const {user, errors} = await service.deleteUser(Number(body.id));
        if (errors.length > 0) {
            return NextResponse.json(ResponseModel.error({
                message: "Có lỗi xảy ra",
                statusCode: 500,
                data: errors,
            }));
        }

        return NextResponse.json(ResponseModel.success({
            message: "Xoá thành công!",
            data: user
        }));
    } catch (err) {
        console.error("DELETE /users error:", err);
        return NextResponse.json(ResponseModel.error({
            message: "Internal Server Error",
            statusCode: 500,
            data: err,
        }));
    }
}

export const GET = authorizeRequest(getUsers, "MANAGE_USERS")
export const POST = authorizeRequest(createUser, "MANAGE_USERS")
export const PUT = authorizeRequest(updateUser, "MANAGE_USERS")
export const DELETE = authorizeRequest(deleteUser, "MANAGE_USERS")
