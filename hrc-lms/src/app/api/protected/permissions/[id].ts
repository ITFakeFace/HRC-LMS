import {NextRequest, NextResponse} from "next/server";
import {useRouter} from "next/router";
import {authorizeRequest} from "@/lib/authorize";
import {PermissionService} from "@/services/PermissionService";
import {ResponseModel} from "@/models/ResponseModel";

const service = new PermissionService();

// ------------------------
// GET permission by ID
// ------------------------
const getPermissionById = authorizeRequest(
    async () => {
        const router = useRouter();
        const {id} = router.query;
        const permission = await service.getPermissionById(Number(id));
        return NextResponse.json(permission);
    },
    "PERMISSION_MANAGEMENT"
);

// ------------------------
// PUT update permission by ID
// ------------------------
const updatePermission = authorizeRequest(
    async (
        req: NextRequest,
    ) => {
        const router = useRouter();
        const {id} = router.query;
        const body = await req.json();
        const updated = await service.updatePermission(Number(id), body.name, body.description);
        return NextResponse.json(updated);
    },
    "PERMISSION_MANAGEMENT"
);

// ------------------------
// DELETE permission by ID
// ------------------------
const deletePermission = authorizeRequest(
    async (
        req: NextRequest,
    ) => {
        const router = useRouter();
        const {id} = router.query;
        await service.deletePermission(Number(id));
        return NextResponse.json("");
    },
    "PERMISSION_MANAGEMENT"
);

export const GET = authorizeRequest(getPermissionById, "MANAGE_PERMISSIONS");
export const PUT = authorizeRequest(updatePermission, "MANAGE_PERMISSIONS");
export const DELETE = authorizeRequest(deletePermission, "MANAGE_PERMISSIONS");
