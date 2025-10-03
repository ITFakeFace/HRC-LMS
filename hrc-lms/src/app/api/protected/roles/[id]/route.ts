import {NextRequest, NextResponse} from "next/server";
import {authorizeRequest} from "@/lib/authorize";
import {RoleService} from "@/services/RoleService";
import {ResponseModel} from "@/models/ResponseModel";

const service = new RoleService();

// ------------------------
// GET role by ID
// ------------------------
const getRoleById = async (
    req: NextRequest,
    userId: string,
    params: { id: string }
): Promise<NextResponse> => {
    const id = Number(params?.id);
    const role = await service.getRoleById(id);

    if (!role) {
        return NextResponse.json({message: "Not found"}, {status: 404});
    }

    return NextResponse.json(role);
};

// ------------------------
// PUT update role by ID
// ------------------------
const updateRole = async (
    req: NextRequest,
    userId: string,
    params: { id: string }
) => {
    const id = Number(params?.id);
    const body = await req.json();
    const updated = await service.updateRole(id, body.data);
    return NextResponse.json(ResponseModel.success({
        message: "Thành công!",
        data: updated,
    }));
};

// ------------------------
// DELETE role by ID
// ------------------------
const deleteRole = async (
    req: NextRequest,
    userId: string,
    params: { id: string }
) => {
    const id = Number(params?.id);
    await service.deleteRole(id);
    return NextResponse.json(ResponseModel.success({
        message: "Thành công!",
        data: null,
    }));
};

export const GET = authorizeRequest(getRoleById, "MANAGE_ROLES");
export const PUT = authorizeRequest(updateRole, "MANAGE_ROLES");
export const DELETE = authorizeRequest(deleteRole, "MANAGE_ROLES");
