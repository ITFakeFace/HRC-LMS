// src/utils/constants.js

// Kiểm tra và lấy biến môi trường
if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET must be defined in the environment variables.');
}

// ⚠️ Quan trọng: Jose yêu cầu Secret Key là Uint8Array.
// Dùng TextEncoder() là cách chuẩn trong Node.js/JavaScript để làm việc này.
export const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET);

export const ISSUER = process.env.JWT_ISSUER || 'your-app-issuer';
export const AUDIENCE = process.env.JWT_AUDIENCE || 'your-app-audience';

export const ACCESS_TOKEN_EXPIRATION = process.env.ACCESS_TOKEN_EXPIRATION || '1h';
export const SHORT_REFRESH_TOKEN_EXPIRATION = process.env.SHORT_REFRESH_TOKEN_EXPIRATION || '7d';
export const LONG_REFRESH_TOKEN_EXPIRATION = process.env.LONG_REFRESH_TOKEN_EXPIRATION || '7d';
