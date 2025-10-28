// Sử dụng kiểu Buffer cho avatar để khớp với Bytes? trong Prisma
import {RoleConnectDto} from "@/dtos/user/UserCreateDto";

export interface UserUpdateDto {
    pID: string;
    username: string;
    phone?: string | null;
    email: string;
    password?: string;
    avatar?: Buffer | null; // Kiểu Buffer cho tệp tin
    fullname: string;
    gender: boolean;
    dob: Date;
    isEmailVerified?: boolean | null;
    lockoutEnd?: Date | null; // DateTime? trong Prisma, có thể là Date hoặc null/undefined

    roles: RoleConnectDto[];
}
