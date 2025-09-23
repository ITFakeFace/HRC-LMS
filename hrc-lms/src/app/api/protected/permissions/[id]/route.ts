import {NextRequest, NextResponse} from "next/server";
import {authorizeRequest} from "@/lib/authorize";
import {PermissionService} from "@/services/PermissionService";
import {ResponseModel} from "@/models/ResponseModel";

const service = new PermissionService();

// ------------------------
// GET permission by ID
// ------------------------
const getPermissionById = async (
    req: NextRequest,
    userId: string,
    params: { id: string }
): Promise<NextResponse> => {
    const id = Number(params?.id);
    const permission = await service.getPermissionById(id);

    if (!permission) {
        return NextResponse.json({message: "Not found"}, {status: 404});
    }

    return NextResponse.json(permission);
};

// ------------------------
// PUT update permission by ID
// ------------------------
const updatePermission = async (
    req: NextRequest,
    userId: string,
    params: { id: string }
) => {
    const id = Number(params?.id);
    const body = await req.json();
    const updated = await service.updatePermission(id, body.name, body.description);
    return NextResponse.json(ResponseModel.success({
        message: "Thành công!",
        data: updated,
    }));
};

// ------------------------
// DELETE permission by ID
// ------------------------
const deletePermission = async (
    req: NextRequest,
    userId: string,
    params: { id: string }
) => {
    const id = Number(params?.id);
    await service.deletePermission(id);
    return NextResponse.json(ResponseModel.success({
        message: "Thành công!",
        data: null,
    }));
};

export const GET = authorizeRequest(getPermissionById, "MANAGE_PERMISSIONS");
export const PUT = authorizeRequest(updatePermission, "MANAGE_PERMISSIONS");
export const DELETE = authorizeRequest(deletePermission, "MANAGE_PERMISSIONS");
