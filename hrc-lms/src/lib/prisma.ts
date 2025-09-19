import {PrismaClient} from "@prisma/client";

declare global {
    // prevent creating multiple clients in dev (hot reload)
    // eslint-disable-next-line no-var
    var __prisma: PrismaClient;
}

export const prisma =
    globalThis.__prisma ??
    new PrismaClient({
        log: process.env.NODE_ENV === "development" ? ["query", "error"] : ["error"]
    });

if (process.env.NODE_ENV === "development") globalThis.__prisma = prisma;