// services/jwt.service.js
import { SignJWT, jwtVerify } from 'jose';
import crypto from 'node:crypto'; // Import crypto module
import {ACCESS_TOKEN_EXPIRATION, AUDIENCE, ISSUER, JWT_SECRET, SHORT_REFRESH_TOKEN_EXPIRATION} from '@/utils/constants'; // Import Named Export từ constants.js
import { getUserFullPayload } from './auth.service.js'; // Import Named Export từ auth.service.js
import prisma from '@/libs/prisma.js'; // Giả định prismaClient dùng export default
import ms from 'ms';
import JwtPayloadSchema from "@/features/auth/jwt.schema.js";

/**
 * Tạo cả Access Token và Refresh Token
 * @param {number} userId ID người dùng
 * @param {string} ipAddress Địa chỉ IP của client
 * @param {string} userAgent Thông tin thiết bị/trình duyệt
 * @param refreshTokenExpiration
 */
async function generateAuthTokens(userId, ipAddress, userAgent, refreshTokenExpiration = SHORT_REFRESH_TOKEN_EXPIRATION) {
    const payload = await getUserFullPayload(userId);
    if (!payload) throw new Error("User data for token creation not found.");

    const jti = crypto.randomUUID();

    // --- 1. ACCESS TOKEN (Ngắn hạn) ---
    const accessToken = await new SignJWT(payload)
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        // Sử dụng chuỗi trực tiếp, ms đã được sử dụng nội bộ bởi jose
        .setExpirationTime(ACCESS_TOKEN_EXPIRATION)
        .setIssuer(ISSUER)
        .setAudience(AUDIENCE)
        .sign(JWT_SECRET);

    // --- 2. REFRESH TOKEN (Dài hạn) ---
    const refreshToken = await new SignJWT({
        sub: payload.sub,
        jti: jti,
    })
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime(SHORT_REFRESH_TOKEN_EXPIRATION)
        .setIssuer(ISSUER)
        .setAudience(AUDIENCE)
        .sign(JWT_SECRET);

    // --- 3. LƯU REFRESH TOKEN VÀO DB ---

    // SỬ DỤNG THƯ VIỆN ms ĐỂ CHUYỂN ĐỔI SANG MILIGIAY CHO CSDL
    const expiryTimeMs = ms(refreshTokenExpiration);

    await prisma.refreshToken.create({
        data: {
            jti: jti,
            userId: userId,
            // Tính toán thời điểm hết hạn (thời gian hiện tại + số miligiây)
            expiresAt: new Date(Date.now() + expiryTimeMs),
            ipAddress: ipAddress,
            userAgent: userAgent,
        }
    });

    return { accessToken, refreshToken };
}


/**
 * Xác thực token
 */
async function verifyJwt(token) {
    try {
        const { payload } = await jwtVerify(
            token,
            JWT_SECRET,
            {
                issuer: ISSUER,
                audience: AUDIENCE,
            }
        );

        // 🆕 BƯỚC TƯƠNG TÁC: Kiểm tra cấu trúc Payload bằng Zod Schema
        const validatedPayload = JwtPayloadSchema.parse(payload);

        // Nếu parse thành công, payload hợp lệ cả về chữ ký và cấu trúc
        return { isValid: true, payload: validatedPayload };

    } catch (error) {
        let message = error.message;

        // Nếu lỗi là do Zod Validation thất bại (payload không đúng cấu trúc)
        if (error.name === 'ZodError') {
            message = 'Token payload validation failed: Invalid structure.';
        }

        return { isValid: false, error: message };
    }
}

export { generateAuthTokens, verifyJwt };