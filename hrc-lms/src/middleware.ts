import {NextRequest, NextResponse} from "next/server";
import {verifyAccessToken} from "@/utils/jwt";

export const runtime = "nodejs";

export async function middleware(req: NextRequest) {
    const url = req.nextUrl;

    // Chỉ protect /dashboard và /api/protected/*
    if (url.pathname.startsWith("/dashboard") || url.pathname.startsWith("/api/protected")) {
        const accessToken = req.cookies.get("access_token")?.value;
        const refreshToken = req.cookies.get("refresh_token")?.value;

        // Không có token nào → redirect login
        if (!accessToken && !refreshToken) {
            return NextResponse.redirect(new URL("/login", req.url));
        }

        try {
            // Verify access token
            const payload = await verifyAccessToken(accessToken!);
            const res = NextResponse.next();
            res.headers.set("x-user-id", String(payload?.userId));
            return res;
        } catch {
            // Access token expired → call refresh token API
            if (!refreshToken) return NextResponse.redirect(new URL("/login", req.url));

            // Gọi API refresh
            const refreshRes = await fetch(`${req.nextUrl.origin}/api/auth/refresh`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    cookie: `refresh_token=${refreshToken}`,
                },
            });

            if (refreshRes.status !== 200) {
                return NextResponse.redirect(new URL("/login", req.url));
            }

            const data = await refreshRes.json();
            const newAccessToken = data.accessToken;

            const res = NextResponse.next();
            res.cookies.set("access_token", newAccessToken, {
                httpOnly: true,
                sameSite: "lax",
                path: "/",
                secure: process.env.NODE_ENV === "production",
                maxAge: 60 * 15, // 15 phút
            });

            res.headers.set("x-user-id", String(data.user.id));
            return res;
        }
    }

    return NextResponse.next();
}

export const config = {
    matcher: ["/dashboard/:path*", "/api/protected/:path*"],
};
