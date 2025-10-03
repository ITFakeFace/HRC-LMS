import {NextRequest, NextResponse} from "next/server";
import {authorizeRequest} from "@/lib/authorize";
import {RolePermissionService} from "@/services/RolePermissionService";
import {ResponseModel} from "@/models/ResponseModel";

const service = new RolePermissionService();

// -----------------------------
// POST: Add permission to role
// body: { roleId: number, permissionId: number }
// -----------------------------
const addPermissionToRole = async (req: NextRequest) => {
    try {
        const body = await req.json();
        const {roleId, permissionId} = body;

        if (!roleId || !permissionId) {
            return NextResponse.json(ResponseModel.error({
                message: "roleId và permissionId là bắt buộc",
                statusCode: 400,
                data: null,
            }), {status: 400});
        }

        const {rolePermission, errors} = await service.addPermissionToRole({roleId, permissionId});
        if (errors.length > 0) {
            return NextResponse.json(ResponseModel.error({
                message: "Không thể thêm permission vào role",
                statusCode: 400,
                data: errors,
            }), {status: 400});
        }

        return NextResponse.json(ResponseModel.success({
            message: "Thêm permission vào role thành công!",
            data: rolePermission,
        }));
    } catch (err) {
        console.error("POST /roles/permissions error:", err);
        return NextResponse.json(ResponseModel.error({
            message: "Internal Server Error",
            statusCode: 500,
            data: err,
        }), {status: 500});
    }
};

// -----------------------------
// DELETE: Remove permission from role
// body: { roleId: number, permissionId: number }
// -----------------------------
const removePermissionFromRole = async (req: NextRequest) => {
    try {
        const body = await req.json();
        const {roleId, permissionId} = body;

        if (!roleId || !permissionId) {
            return NextResponse.json(ResponseModel.error({
                message: "roleId và permissionId là bắt buộc",
                statusCode: 400,
                data: null,
            }), {status: 400});
        }

        const {rolePermission, errors} = await service.removePermissionFromRole(roleId, permissionId);
        if (errors.length > 0) {
            return NextResponse.json(ResponseModel.error({
                message: "Không thể xoá permission khỏi role",
                statusCode: 400,
                data: errors,
            }), {status: 400});
        }

        return NextResponse.json(ResponseModel.success({
            message: "Xoá permission khỏi role thành công!",
            data: rolePermission,
        }));
    } catch (err) {
        console.error("DELETE /roles/permissions error:", err);
        return NextResponse.json(ResponseModel.error({
            message: "Internal Server Error",
            statusCode: 500,
            data: err,
        }), {status: 500});
    }
};

export const POST = authorizeRequest(addPermissionToRole, "MANAGE_ROLES");
export const DELETE = authorizeRequest(removePermissionFromRole, "MANAGE_ROLES");
