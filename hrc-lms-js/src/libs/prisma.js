// src/lib/prisma.js
import { PrismaClient } from '@prisma/client';

// Khai báo biến global cho Prisma Client
// Sử dụng 'var' hoặc kiểm tra 'global' để truy cập biến toàn cục trong môi trường Node/Next.js
const prisma = global.prisma || new PrismaClient({
    // Ghi log các truy vấn (query) chỉ trong môi trường phát triển
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

// Nếu không phải môi trường production, gán instance vào biến global
if (process.env.NODE_ENV !== 'production') {
    global.prisma = prisma;
}

export default prisma;