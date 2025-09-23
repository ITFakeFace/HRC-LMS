// lib/authorize.ts
import {NextRequest, NextResponse} from "next/server";
import {prisma} from "@/lib/prisma";
import {verifyJWT} from "@/utils/jwt"; // Prisma client

export async function authorize(req: NextRequest, permission: string) {
    // Lấy token từ cookie, giả sử tên cookie là "access_token"
    const token = req.cookies.get("access_token")?.value;
    if (!token) return NextResponse.json({message: "Unauthorized token"}, {status: 401});

    const payload = await verifyJWT(token);
    if (!payload) return NextResponse.json({message: "Unauthorized payload"}, {status: 401});

    const userRoles = await prisma.userRole.findMany({
        where: {userId: Number(payload.userId)},
        include: {role: {include: {rolePermissions: {include: {permission: true}}}}},
    });

    const permissions = userRoles.flatMap((ur) => ur.role.rolePermissions.map((rp) => rp.permission.name));

    if (!permissions.includes(permission)) {
        return NextResponse.json({message: "Forbidden"}, {status: 403});
    }

    return payload.userId;
}


export function authorizeRequest(
    handler: (req: NextRequest, userId: string, params?: any) => Promise<NextResponse>,
    permission: string
) {
    return async function (req: NextRequest, {params}: { params: any }) {
        const auth = await authorize(req, permission);
        if (auth instanceof NextResponse) return auth;

        // auth = userId nếu hợp lệ
        return handler(req, auth, params);
    };
}
