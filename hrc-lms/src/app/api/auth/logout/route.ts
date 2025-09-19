import {NextResponse} from "next/server";
import {clearAuthCookies} from "@/utils/cookies";

export async function POST() {
    const res = NextResponse.json({ok: true});
    clearAuthCookies(res);
    // OPTIONAL: revoke refresh token from DB
    return res;
}