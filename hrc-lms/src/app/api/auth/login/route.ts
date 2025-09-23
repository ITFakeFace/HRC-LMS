import {NextResponse} from "next/server";
import {setAuthCookies} from "@/utils/cookies";
import {AuthService} from "@/services/AuthService";
import {ResponseModel} from "@/models/ResponseModel";

const service = new AuthService();

export async function POST(req: Request) {
    const body = await req.json();
    const {email, password, rememberMe} = body;

    const result = await service.login(email, password, rememberMe);

    if (!result) {
        return NextResponse.json(ResponseModel.error({
            message: "Sai thông tin đăng nhập, vui lòng kiểm tra lại email hoặc mật khẩu",
            statusCode: 401,
            data: null
        }), {status: 401});
    }

    // Tạo response chính
    const res = NextResponse.json(ResponseModel.success({
        message: "Thành công!",
        data: {
            user: result.user,
            token: result.accessToken,
        },
    }), {status: 200});

    // Set cookie trên response này
    setAuthCookies(
        res,
        result.accessToken,
        result.refreshToken.token,
        result.refreshTokenExpiry
    );

    return res;
}
