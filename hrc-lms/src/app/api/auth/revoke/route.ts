import {NextRequest, NextResponse} from "next/server";
import {ResponseModel} from "@/models/ResponseModel";
import {verifyRefreshToken} from "@/utils/jwt";
import {AuthService} from "@/services/AuthService";

const service = new AuthService();

export async function POST(req: NextRequest) {
    try {
        const {refreshToken} = await req.json();

        if (!refreshToken) {
            return NextResponse.json(
                ResponseModel.error({
                    message: "Refresh token required",
                    statusCode: 400,
                    data: null,
                }),
                {status: 400}
            );
        }

        // Verify refresh token
        const payload = await verifyRefreshToken(refreshToken);
        if (!payload?.jti) {
            return NextResponse.json(
                ResponseModel.error({
                    message: "Invalid token",
                    statusCode: 401,
                    data: null,
                }),
                {status: 401}
            );
        }

        // Revoke token in DB
        await service.revokeToken(payload.jti);

        return NextResponse.json(
            ResponseModel.success({
                message: "Token revoked thành công",
                statusCode: 200,
                data: {},
            }),
            {status: 200}
        );
    } catch (err) {
        console.error("Revoke error:", err);
        return NextResponse.json(
            ResponseModel.error({
                message: "Internal Server Error",
                statusCode: 500,
                data: err,
            }),
            {status: 500}
        );
    }
}
