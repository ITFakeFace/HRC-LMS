// src/app/api/protected/users/roles/route.ts
import {NextRequest, NextResponse} from "next/server";
import {authorizeRequest} from "@/lib/authorize";
import {UserRoleService} from "@/services/UserRoleService";
import {ResponseModel} from "@/models/ResponseModel";
import {UserRoleCreateDto} from "@/dtos/user-role/UserRoleCreateDto";

const service = new UserRoleService();


// -----------------------------
// GET users of a role
// query: /roles/users?roleId=2
// -----------------------------
const getUsersByRole = async (req: NextRequest) => {
    try {
        const url = new URL(req.url);
        const roleId = Number(url.searchParams.get("roleId"));
        if (!roleId) {
            return NextResponse.json(ResponseModel.error({
                message: "roleId là bắt buộc",
                statusCode: 400,
                data: null,
            }), {status: 400});
        }

        const users = await service.getUsersByRole(roleId);
        return NextResponse.json(ResponseModel.success({
            message: "Lấy users thành công",
            data: users,
        }));
    } catch (err) {
        console.error("GET /roles/users error:", err);
        return NextResponse.json(ResponseModel.error({
            message: "Internal Server Error",
            statusCode: 500,
            data: err,
        }), {status: 500});
    }
};

// -----------------------------
// POST: Add role to user
// body: { userId: number, roleId: number }
// -----------------------------
const addRoleToUser = async (req: NextRequest) => {
    try {
        const body: UserRoleCreateDto = await req.json();
        const {userId, roleId} = body;

        if (!userId || !roleId) {
            return NextResponse.json(ResponseModel.error({
                message: "userId và roleId là bắt buộc",
                statusCode: 400,
                data: null,
            }), {status: 400});
        }

        const {userRole, errors} = await service.addRoleToUser(body);
        if (errors.length > 0) {
            return NextResponse.json(ResponseModel.error({
                message: "Không thể thêm role vào user",
                statusCode: 400,
                data: errors,
            }), {status: 400});
        }

        return NextResponse.json(ResponseModel.success({
            message: "Thêm role vào user thành công!",
            data: userRole,
        }));
    } catch (err) {
        console.error("POST /users/roles error:", err);
        return NextResponse.json(ResponseModel.error({
            message: "Internal Server Error",
            statusCode: 500,
            data: err,
        }), {status: 500});
    }
};

// -----------------------------
// DELETE: Remove role from user
// body: { userId: number, roleId: number }
// -----------------------------
const removeRoleFromUser = async (req: NextRequest) => {
    try {
        const body: UserRoleCreateDto = await req.json();
        const {userId, roleId} = body;

        if (!userId || !roleId) {
            return NextResponse.json(ResponseModel.error({
                message: "userId và roleId là bắt buộc",
                statusCode: 400,
                data: null,
            }), {status: 400});
        }

        const {userRole, errors} = await service.removeRoleFromUser(userId, roleId);
        if (errors.length > 0) {
            return NextResponse.json(ResponseModel.error({
                message: "Không thể xóa role khỏi user",
                statusCode: 400,
                data: errors,
            }), {status: 400});
        }

        return NextResponse.json(ResponseModel.success({
            message: "Xóa role khỏi user thành công!",
            data: userRole,
        }));
    } catch (err) {
        console.error("DELETE /users/roles error:", err);
        return NextResponse.json(ResponseModel.error({
            message: "Internal Server Error",
            statusCode: 500,
            data: err,
        }), {status: 500});
    }
};

export const GET = authorizeRequest(getUsersByRole, "MANAGE_USERS");
export const POST = authorizeRequest(addRoleToUser, "MANAGE_USERS");
export const DELETE = authorizeRequest(removeRoleFromUser, "MANAGE_USERS");
