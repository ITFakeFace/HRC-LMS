import {NextRequest, NextResponse} from "next/server";
import {authorizeRequest} from "@/lib/authorize";
import {ResponseModel} from "@/models/ResponseModel";
import {RolePermissionService} from "@/services/RolePermissionService";

const service = new RolePermissionService();

// -----------------------------
// POST: Add role to permission
// body: { permissionId: number, roleId: number }
// -----------------------------
const addRoleToPermission = async (req: NextRequest) => {
    try {
        const body = await req.json();
        const {permissionId, roleId} = body;

        if (!permissionId || !roleId) {
            return NextResponse.json(ResponseModel.error({
                message: "permissionId và roleId là bắt buộc",
                statusCode: 400,
                data: null
            }), {status: 400});
        }

        const updatedPermission = await service.addPermissionToRole({roleId: roleId, permissionId: permissionId});
        return NextResponse.json(ResponseModel.success({
            message: "Thêm role vào permission thành công!",
            data: updatedPermission,
        }));
    } catch (err) {
        console.error("POST /permissions/roles error:", err);
        return NextResponse.json(ResponseModel.error({
            message: "Internal Server Error",
            statusCode: 500,
            data: err,
        }), {status: 500});
    }
};

// -----------------------------
// DELETE: Remove role from permission
// body: { permissionId: number, roleId: number }
// -----------------------------
const removeRoleFromPermission = async (req: NextRequest) => {
    try {
        const body = await req.json();
        const {permissionId, roleId} = body;

        if (!permissionId || !roleId) {
            return NextResponse.json(ResponseModel.error({
                message: "permissionId và roleId là bắt buộc",
                statusCode: 400,
                data: null
            }), {status: 400});
        }

        const updatedPermission = await service.removePermissionFromRole(roleId, permissionId);
        return NextResponse.json(ResponseModel.success({
            message: "Xóa role khỏi permission thành công!",
            data: updatedPermission,
        }));
    } catch (err) {
        console.error("DELETE /permissions/roles error:", err);
        return NextResponse.json(ResponseModel.error({
            message: "Internal Server Error",
            statusCode: 500,
            data: err,
        }), {status: 500});
    }
};

export const POST = authorizeRequest(addRoleToPermission, "MANAGE_PERMISSIONS");
export const DELETE = authorizeRequest(removeRoleFromPermission, "MANAGE_PERMISSIONS");
