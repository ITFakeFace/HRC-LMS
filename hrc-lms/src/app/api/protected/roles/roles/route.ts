import {NextRequest, NextResponse} from "next/server";
import {authorizeRequest} from "@/lib/authorize";
import {RoleHierarchyService} from "@/services/RoleHierarchyService";
import {ResponseModel} from "@/models/ResponseModel";

const service = new RoleHierarchyService();

// -----------------------------
// POST: Add child role to parent role
// body: { parentId: number, childId: number }
// -----------------------------
const addChildRole = async (req: NextRequest) => {
    try {
        const body = await req.json();
        const {parentId, childId} = body;

        if (!parentId || !childId) {
            return NextResponse.json(ResponseModel.error({
                message: "parentId và childId là bắt buộc",
                statusCode: 400,
                data: null,
            }), {status: 400});
        }

        const {roleHierarchy, errors} = await service.create({parentId, childId});
        if (errors.length > 0) {
            return NextResponse.json(ResponseModel.error({
                message: "Không thể thêm quan hệ role",
                statusCode: 400,
                data: errors,
            }), {status: 400});
        }

        return NextResponse.json(ResponseModel.success({
            message: "Thêm quan hệ role thành công!",
            data: roleHierarchy,
        }));
    } catch (err) {
        console.error("POST /roles/roles error:", err);
        return NextResponse.json(ResponseModel.error({
            message: "Internal Server Error",
            statusCode: 500,
            data: err,
        }), {status: 500});
    }
};

// -----------------------------
// DELETE: Remove child role from parent role
// body: { parentId: number, childId: number }
// -----------------------------
const removeChildRole = async (req: NextRequest) => {
    try {
        const body = await req.json();
        const {parentId, childId} = body;

        if (!parentId || !childId) {
            return NextResponse.json(ResponseModel.error({
                message: "parentId và childId là bắt buộc",
                statusCode: 400,
                data: null,
            }), {status: 400});
        }

        const {roleHierarchy, errors} = await service.delete(parentId, childId);
        if (errors.length > 0) {
            return NextResponse.json(ResponseModel.error({
                message: "Không thể xoá quan hệ role",
                statusCode: 400,
                data: errors,
            }), {status: 400});
        }

        return NextResponse.json(ResponseModel.success({
            message: "Xoá quan hệ role thành công!",
            data: roleHierarchy,
        }));
    } catch (err) {
        console.error("DELETE /roles/roles error:", err);
        return NextResponse.json(ResponseModel.error({
            message: "Internal Server Error",
            statusCode: 500,
            data: err,
        }), {status: 500});
    }
};

export const POST = authorizeRequest(addChildRole, "MANAGE_ROLES");
export const DELETE = authorizeRequest(removeChildRole, "MANAGE_ROLES");
