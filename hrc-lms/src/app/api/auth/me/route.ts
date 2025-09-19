import {cookies} from "next/headers";
import {NextResponse} from "next/server";
import {jwtVerify} from "jose";

const encoder = new TextEncoder();

export async function GET() {
    const cookieStore = await cookies();
    const token = cookieStore.get("access_token");

    if (!token) {
        return NextResponse.json({error: "No token found"}, {status: 401});
    }

    try {
        const {payload} = await jwtVerify(token.value, encoder.encode(process.env.JWT_SECRET!));

        // sub luôn là string, convert sang number nếu cần
        const userId = Number(payload.sub);

        return NextResponse.json({
            user: {
                id: userId,
                roles: payload.roles ?? [],
                permissions: payload.permissions ?? [],
                exp: payload.exp ? new Date(payload.exp * 1000) : null
            }
        });
    } catch (err: any) {
        if (err.code === "ERR_JWT_EXPIRED") {
            return NextResponse.json({error: "Token expired"}, {status: 401});
        }
        return NextResponse.json({error: "Invalid token"}, {status: 401});
    }
}
