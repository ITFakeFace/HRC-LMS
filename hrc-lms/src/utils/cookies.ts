import {NextResponse} from "next/server";
import ms from "ms";

export const ACCESS_TOKEN_COOKIE = "access_token";
export const REFRESH_TOKEN_COOKIE = "refresh_token";

export function setAuthCookies(res: NextResponse, accessToken: string, refreshToken: string, refreshTokenExpiry: number) {
    res.cookies.set("access_token", accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: ms("15m"), // access token sống ngắn
    });

    res.cookies.set("refresh_token", refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: refreshTokenExpiry / 1000, // đổi sang giây
    });

}

export function clearAuthCookies(res: NextResponse) {
    res.cookies.set({
        name: ACCESS_TOKEN_COOKIE,
        value: "",
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
        maxAge: 0
    });
    res.cookies.set({
        name: REFRESH_TOKEN_COOKIE,
        value: "",
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
        maxAge: 0
    });
}
