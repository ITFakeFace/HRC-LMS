import {NextResponse} from "next/server";
import {verifyRefreshToken, signAccessToken} from "@/utils/jwt";
import {prisma} from "@/lib/prisma";
import {REFRESH_TOKEN_COOKIE, ACCESS_TOKEN_COOKIE} from "@/utils/cookies";
import {ResponseModel} from "@/models/ResponseModel";

export const runtime = "nodejs";

export async function POST(req: Request) {
    try {
        const cookie = req.headers.get("cookie") || "";
        const match = cookie
            .split("; ")
            .find((c) => c.startsWith(`${REFRESH_TOKEN_COOKIE}=`));
        const refreshToken = match ? match.split("=")[1] : null;

        if (!refreshToken) {
            return NextResponse.json(
                ResponseModel.error({
                    message: "No refresh token",
                    statusCode: 401,
                    data: null,
                }),
                {status: 401}
            );
        }

        // Kiểm tra DB
        const storedToken = await prisma.refreshToken.findUnique({
            where: {tokenId: refreshToken},
        });

        if (!storedToken || storedToken.revoked || storedToken.expiresAt < new Date()) {
            return NextResponse.json(
                ResponseModel.error({
                    message: "Refresh token expired",
                    statusCode: 401,
                    data: null,
                }),
                {status: 401}
            );
        }

        // Verify refresh token signature
        const payload = await verifyRefreshToken(refreshToken);
        if (!payload) {
            return NextResponse.json(
                ResponseModel.error({
                    message: "Invalid refresh token",
                    statusCode: 401,
                    data: null,
                }),
                {status: 401}
            );
        }

        // Tạo access token mới
        const newAccessToken = await signAccessToken({sub: Number(payload.userId)});

        // Response
        const res = NextResponse.json(
            ResponseModel.success({
                message: "Access token refreshed successfully",
                statusCode: 200,
                data: {
                    accessToken: newAccessToken,
                    user: {id: payload.userId},
                },
            }),
            {status: 200}
        );

        // Set lại cookie access token
        res.cookies.set(ACCESS_TOKEN_COOKIE, newAccessToken, {
            httpOnly: true,
            sameSite: "lax",
            path: "/",
            secure: process.env.NODE_ENV === "production",
            maxAge: 60 * 15, // 15 phút
        });

        return res;
    } catch (err) {
        console.error("Refresh token error:", err);
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
