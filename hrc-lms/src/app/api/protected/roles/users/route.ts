// src/app/api/protected/roles/users/route.ts
import {NextRequest, NextResponse} from "next/server";
import {authorizeRequest} from "@/lib/authorize";
import {UserRoleService} from "@/services/UserRoleService";
import {ResponseModel} from "@/models/ResponseModel";

const service = new UserRoleService();

// -----------------------------
// GET: Get all roles of a user
// query: ?userId=1
// -----------------------------
const getRolesByUser = async (req: NextRequest) => {
    try {
        const userId = Number(req.nextUrl.searchParams.get("userId"));
        if (!userId) {
            return NextResponse.json(ResponseModel.error({
                message: "userId là bắt buộc",
                statusCode: 400,
                data: null,
            }), {status: 400});
        }

        const roles = await service.getRolesByUser(userId);
        return NextResponse.json(ResponseModel.success({
            message: "Lấy danh sách roles thành công",
            data: roles,
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
// POST: Add a role to a user
// body: { userId: number, roleId: number }
// -----------------------------
const addRoleToUser = async (req: NextRequest) => {
    try {
        const body = await req.json();
        const {userId, roleId} = body;

        if (!userId || !roleId) {
            return NextResponse.json(ResponseModel.error({
                message: "userId và roleId là bắt buộc",
                statusCode: 400,
                data: null,
            }), {status: 400});
        }

        const {userRole, errors} = await service.addRoleToUser({userId, roleId});
        if (errors.length > 0) {
            return NextResponse.json(ResponseModel.error({
                message: "Không thể thêm role vào user",
                statusCode: 400,
                data: errors,
            }), {status: 400});
        }

        return NextResponse.json(ResponseModel.success({
            message: "Thêm role vào user thành công",
            data: userRole,
        }));
    } catch (err) {
        console.error("POST /roles/users error:", err);
        return NextResponse.json(ResponseModel.error({
            message: "Internal Server Error",
            statusCode: 500,
            data: err,
        }), {status: 500});
    }
};

// -----------------------------
// DELETE: Remove a role from a user
// body: { userId: number, roleId: number }
// -----------------------------
const removeRoleFromUser = async (req: NextRequest) => {
    try {
        const body = await req.json();
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
                message: "Không thể xoá role khỏi user",
                statusCode: 400,
                data: errors,
            }), {status: 400});
        }

        return NextResponse.json(ResponseModel.success({
            message: "Xoá role khỏi user thành công",
            data: userRole,
        }));
    } catch (err) {
        console.error("DELETE /roles/users error:", err);
        return NextResponse.json(ResponseModel.error({
            message: "Internal Server Error",
            statusCode: 500,
            data: err,
        }), {status: 500});
    }
};

export const GET = authorizeRequest(getRolesByUser, "MANAGE_USERS");
export const POST = authorizeRequest(addRoleToUser, "MANAGE_USERS");
export const DELETE = authorizeRequest(removeRoleFromUser, "MANAGE_USERS");
