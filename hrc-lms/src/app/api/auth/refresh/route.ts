import {NextResponse} from "next/server";
import {verifyRefreshToken, signAccessToken} from "@/utils/jwt";
import {prisma} from "@/lib/prisma";
import {REFRESH_TOKEN_COOKIE, ACCESS_TOKEN_COOKIE} from "@/utils/cookies";
import {ResponseModel} from "@/models/ResponseModel";
import {AuthService} from "@/services/AuthService";

export const runtime = "nodejs";
const authService = new AuthService();

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

        const {accessToken, refreshToken: newRefreshToken, user} =
            await authService.refreshTokens(refreshToken);

        const res = NextResponse.json(
            ResponseModel.success({
                message: "Access token refreshed successfully",
                statusCode: 200,
                data: {accessToken, user},
            }),
            {status: 200}
        );

        // Set lại cookie access token
        res.cookies.set(ACCESS_TOKEN_COOKIE, accessToken, {
            httpOnly: true,
            sameSite: "lax",
            path: "/",
            secure: process.env.NODE_ENV === "production",
            maxAge: 60 * 15, // 15 phút
        });

        // Set lại refresh token mới
        res.cookies.set(REFRESH_TOKEN_COOKIE, newRefreshToken, {
            httpOnly: true,
            sameSite: "lax",
            path: "/",
            secure: process.env.NODE_ENV === "production",
            maxAge: 60 * 60 * 24 * 7, // 7 ngày
        });

        return res;
    } catch (err) {
        console.error("Refresh token error:", err);
        return NextResponse.json(
            ResponseModel.error({
                message: "Invalid or expired refresh token",
                statusCode: 401,
                data: null,
            }),
            {status: 401}
        );
    }
}
