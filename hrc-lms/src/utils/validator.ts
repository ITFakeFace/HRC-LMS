import {UserDto} from "@/dtos/user/UserDto";
import {prisma} from "@/lib/prisma";

export interface ValidationError {
    key: string;
    message: string;
}

export class Validator {
    static async validateUser(user: UserDto) {
        const errors = [];
        const existListCondition = [];
        // Check required fields
        if (!user.password) {
            errors.push({key: "password", message: "Password không được để trống"});
        }
        if (!user.pID) {
            errors.push({key: "pID", message: "Personal ID không được để trống"});
        } else {
            existListCondition.push({pID: user.pID ?? undefined});
        }
        if (!user.username) {
            errors.push({key: "username", message: "Username không được để trống"});
        } else {
            existListCondition.push({username: user.username ?? undefined});
        }
        if (!user.email) {
            errors.push({key: "email", message: "Email không được để trống"});
        } else {
            existListCondition.push({email: user.email ?? undefined});
        }
        if (user.phone) {
            existListCondition.push({phone: user.phone ?? undefined});
        }
        const existedData = await prisma.user.findMany({
            where: {
                OR: existListCondition,
            }
        });
        if (existedData.length > 0) {
            if (existListCondition.find(u => u.pID === user.pID))
                errors.push({key: "pID", message: "Số CCCD dã được đăng ký"});
            if (existListCondition.find(u => u.email === user.email))
                errors.push({key: "email", message: "Email đã được đăng ký"});
            if (existListCondition.find(u => u.username === user.username))
                errors.push({key: "username", message: "Tên tài khoản đã tồn tại"});
            if (user.phone && existListCondition.find(u => u.phone === user.phone))
                errors.push({key: "phone", message: "Số điện thoại đã tồn tại"});
        }
        return errors;
    }
}