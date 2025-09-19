import {prisma} from "@/lib/prisma";
import {NextResponse} from "next/server";

export const runtime = "nodejs";

export async function GET() {
    try {
        const users = await prisma.user.findMany({
            select: {
                id: true,
                pID: true,
                username: true,
                email: true,
                phone: true,
                fullname: true,
                gender: true,
                dob: true,
                isEmailVerified: true,
                createdAt: true,
                updatedAt: true,
                userRoles: {
                    select: {
                        role: {
                            select: {
                                id: true,
                                fullname: true,
                                shortname: true,
                            },
                        },
                    },
                },
            },
            orderBy: {createdAt: "desc"},
        });

        return NextResponse.json(users);
    } catch (err) {
        console.error(err);
        return NextResponse.json(
            {error: "Internal Server Error"},
            {status: 500}
        );
    }
}