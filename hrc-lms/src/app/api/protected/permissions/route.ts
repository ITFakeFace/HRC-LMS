// app/api/permissions/route.ts
import {NextRequest, NextResponse} from "next/server";
import {authorizeRequest} from "@/lib/authorize";
import {PermissionService} from "@/services/PermissionService";
import {ResponseModel} from "@/models/ResponseModel";

const service = new PermissionService();

// ------------------------
// Route handlers
// ------------------------
async function getPermissions(req: NextRequest) {
    const data = await service.getAllPermissions();
    return NextResponse.json(ResponseModel.success({
        message: "Thành công!",
        statusCode: 200,
        data: data,
    }));
}

async function createPermission(req: NextRequest) {
    const body = await req.json();
    const data = await service.createPermission(body.name, body.description);
    return NextResponse.json(ResponseModel.success({
        message: "Thành công!",
        statusCode: 200,
        data: data,
    }));
}

async function updatePermission(req: NextRequest) {
    const body = await req.json();
    const data = await service.updatePermission(body.id, body.name, body.description);
    return NextResponse.json(ResponseModel.success({
        message: "Thành công!",
        statusCode: 200,
        data: data,
    }));
}

async function deletePermission(req: NextRequest) {
    const {searchParams} = new URL(req.url);
    const id = Number(searchParams.get("id"));
    const data = await service.deletePermission(id);
    return NextResponse.json(ResponseModel.success({
        message: "Thành công!",
        statusCode: 200,
        data: data,
    }));
}

// ------------------------
// Export route handlers wrapped
// ------------------------
export const GET = authorizeRequest(getPermissions, "MANAGE_PERMISSIONS");
export const POST = authorizeRequest(createPermission, "MANAGE_PERMISSIONS");
export const PUT = authorizeRequest(updatePermission, "MANAGE_PERMISSIONS");
export const DELETE = authorizeRequest(deletePermission, "MANAGE_PERMISSIONS");
