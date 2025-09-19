import {SignJWT, jwtVerify, JWTPayload} from "jose";
import {prisma} from "@/lib/prisma"; // Prisma client
import crypto from "crypto";

const encoder = new TextEncoder();

export interface JwtPayload {
    userId: string;
    email?: string;
    iat?: number;
    exp?: number;
}

// ----------------------
// Sign Access Token
// ----------------------
export async function signAccessToken(payload: { sub: number, [key: string]: any }) {
    let finalPayload = {...payload};

    // Nếu có sub, lấy roles + permissions
    if (payload.sub) {
        const userRoles = await prisma.userRole.findMany({
            where: {userId: Number(payload.sub)},
            include: {
                role: {include: {rolePermissions: {include: {permission: true}}}}
            }
        });

        const roles = userRoles.map(ur => ur.role.shortname);
        const permissions = Array.from(new Set(
            userRoles.flatMap(ur => ur.role.rolePermissions.map(rp => rp.permission.name))
        ));

        finalPayload = {...finalPayload, roles, permissions};
    }

    // Ép sub sang string để hợp lệ với JWTPayload
    const jwtPayload: JWTPayload & { roles?: string[], permissions?: string[] } = {
        ...finalPayload,
        sub: finalPayload.sub.toString()
    };

    const jwt = await new SignJWT(jwtPayload)
        .setProtectedHeader({alg: "HS256"})
        .setIssuedAt()
        .setExpirationTime(process.env.JWT_EXPIRES_IN || "15m")
        .sign(encoder.encode(process.env.JWT_SECRET!));

    return jwt;
}

// ----------------------
// Sign Refresh Token
// ----------------------
export async function signRefreshToken(payload: { sub: number, [key: string]: any }) {
    const jti = crypto.randomUUID();
    const finalPayload: JWTPayload & { jti: string } = {
        ...payload,
        sub: payload.sub.toString(), // fix type
        jti
    };

    const jwt = await new SignJWT(finalPayload)
        .setProtectedHeader({alg: "HS256"})
        .setJti(jti)
        .setIssuedAt()
        .setExpirationTime(process.env.REFRESH_TOKEN_EXPIRES_IN || "7d")
        .sign(encoder.encode(process.env.REFRESH_TOKEN_SECRET!));

    return {token: jwt, jti};
}

// ----------------------
// Verify Access Token
// ----------------------
export async function verifyAccessToken(token: string) {
    try {
        const {payload} = await jwtVerify(token, encoder.encode(process.env.JWT_SECRET!));

        const castedPayload = payload as unknown as {
            userId: string;
            email?: string;
            roles?: string[];
            permissions?: string[];
        };

        if (!castedPayload.userId) return null; // bắt buộc userId tồn tại
        return castedPayload;
    } catch {
        return null;
    }
}

// ----------------------
// Verify Refresh Token
// ----------------------
export async function verifyRefreshToken(token: string) {
    try {
        const {payload} = await jwtVerify(token, encoder.encode(process.env.REFRESH_TOKEN_SECRET!));

        const castedPayload = payload as unknown as { jti: string; userId: string };

        if (!castedPayload.jti || !castedPayload.userId) return null;
        return castedPayload;
    } catch {
        return null;
    }
}

export async function verifyJWT(token: string): Promise<JwtPayload | null> {
    try {
        const secret = process.env.JWT_SECRET;
        if (!secret) throw new Error("JWT_SECRET is not defined");

        const {payload} = await jwtVerify(token, encoder.encode(secret));

        if (!payload.sub) return null;

        return {
            ...payload,
            userId: Number(payload.sub), // map sub → userId
        } as unknown as JwtPayload;
    } catch (err) {
        console.error("verifyJWT error:", err);
        return null;
    }
}

export async function signJWT(payload: {
    userId: string;
    roles?: string[];
    permissions?: string[]
}, expiresInSec = 3600) {
    const token = await new SignJWT(payload)
        .setProtectedHeader({alg: "HS256", typ: "JWT"})
        .setIssuedAt()
        .setExpirationTime(expiresInSec)
        .sign(encoder.encode(process.env.JWT_SECRET));
    return token;
}