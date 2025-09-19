import {UserCreateDto} from "@/dtos/user/UserCreateDto";
import {UserDto} from "@/dtos/user/UserDto";

export class UserMapper {
    /**
     * Map từ UserCreateDto sang object để lưu DB
     */
    static fromCreateDto(dto: UserCreateDto) {
        return {
            pID: dto.pID,
            username: dto.username,
            email: dto.email,
            password: dto.password, // nên hash ở service
            fullname: dto.fullname,
            gender: dto.gender,
            dob: dto.dob,
            phone: dto.phone ?? null,
            avatar: dto.avatar ?? null,
            createdAt: new Date(),
            updatedAt: new Date(),
            isEmailVerified: false,
        };
    }

    /**
     * Map từ entity trong DB sang UserDto đầy đủ
     */
    static toDto(entity: any): UserDto {
        return {
            id: entity.id,
            pID: entity.pID,
            username: entity.username,
            phone: entity.phone,
            email: entity.email,
            password: entity.password, // ⚠️ thường không nên trả password ra ngoài
            avatar: entity.avatar,
            fullname: entity.fullname,
            gender: entity.gender,
            dob: entity.dob,
            lockoutEnd: entity.lockoutEnd ?? null,
            isEmailVerified: entity.isEmailVerified,
        };
    }

    /**
     * Map từ entity trong DB sang SafeUserDto (ẩn password và avatar binary)
     */
    static toSafeDto(entity: any) {
        return {
            id: entity.id,
            pID: entity.pID,
            username: entity.username,
            phone: entity.phone,
            email: entity.email,
            fullname: entity.fullname,
            gender: entity.gender,
            dob: entity.dob,
            lockoutEnd: entity.lockoutEnd ?? null,
            isEmailVerified: entity.isEmailVerified,
        };
    }
}