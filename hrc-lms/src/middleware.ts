import {NextRequest, NextResponse} from "next/server";
import {verifyAccessToken} from "@/utils/jwt";
import {AuthService} from "@/services/AuthService";

export const runtime = "nodejs";

export async function middleware(req: NextRequest) {
    const {pathname, origin} = req.nextUrl;

    // ✅ Danh sách route công khai (không cần kiểm tra token)
    const publicPaths = ["/", "/login"];
    if (
        publicPaths.includes(pathname) ||
        pathname.startsWith("/api/auth")
    ) {
        return NextResponse.next();
    }

    // ✅ Các route còn lại đều cần kiểm tra token
    const accessToken = req.cookies.get("access_token")?.value;
    const refreshToken = req.cookies.get("refresh_token")?.value;

    // ❌ Không có bất kỳ token nào → quay lại login
    if (!accessToken && !refreshToken) {
        return NextResponse.redirect(new URL("/login", req.url));
    }

    const service = new AuthService();

    try {
        // ✅ Thử verify access token trước
        const payload = await verifyAccessToken(accessToken!);
        if (!payload) throw new Error("Invalid Payload");

        const res = NextResponse.next();
        res.headers.set("x-user-id", String(payload.userId));
        return res;
    } catch {
        // ❌ Access token hết hạn → kiểm tra refresh token
        if (!refreshToken) {
            return NextResponse.redirect(new URL("/login", req.url));
        }

        try {
            // ✅ Dùng service để refresh token
            const {
                accessToken: newAccessToken,
                refreshToken: newRefreshToken,
                user
            } = await service.refreshTokens(refreshToken);

            const res = NextResponse.next();

            // ✅ Set access token mới
            res.cookies.set("access_token", newAccessToken, {
                httpOnly: true,
                sameSite: "lax",
                path: "/",
                secure: process.env.NODE_ENV === "production",
                maxAge: 60 * 15, // 15 phút
            });

            // ✅ Nếu service trả refresh token mới thì set luôn
            if (newRefreshToken) {
                res.cookies.set("refresh_token", newRefreshToken, {
                    httpOnly: true,
                    sameSite: "lax",
                    path: "/",
                    secure: process.env.NODE_ENV === "production",
                    maxAge: 60 * 60 * 24 * 7, // 7 ngày
                });
            }

            res.headers.set("x-user-id", String(user?.id));
            return res;
        } catch (err) {
            // ❌ Refresh token cũng hết hạn → logout
            return NextResponse.redirect(new URL("/login", req.url));
        }
    }
}

export const config = {
    matcher: [
        "/((?!login|api/auth|_next|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|ico|css|js)$).*)",
    ],
};
