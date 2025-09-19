import {NextResponse} from "next/server";
import {prisma} from "@/lib/prisma";
import bcrypt from "bcryptjs";
import {signAccessToken, signRefreshToken} from "@/utils/jwt";
import ms from "ms";
import {AuthService} from "@/services/AuthService";
import {ResponseModel} from "@/models/ResponseModel";
import {UserDto} from "@/dtos/user/UserDto";
import {UserMapper} from "@/utils/mapper";

export const runtime = "nodejs";
const service = new AuthService();

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const {username, email, password, fullname, gender, dob, phone, pID} = body;

        const result = await service.register({
            pID,
            username,
            email,
            password,
            fullname,
            gender,
            dob: new Date(dob),
            phone,
        });
        if (result.errors.length <= 0)
            return NextResponse.json(ResponseModel.success<UserDto>({
                message: "Thành công!",
                data: UserMapper.toDto(result.user),
            }));
        else
            return NextResponse.json(ResponseModel.error({
                message: "Có lỗi xảy ra",
                statusCode: 500,
                data: result.errors,
            }));
    } catch (err: any) {
        console.error(err);
        const status = err.message.includes("exists") ? 400 : 500;
        return NextResponse.json({error: err.message}, {status});
    }
}
