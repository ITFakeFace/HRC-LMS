import {UserCreateDto} from "@/dtos/user/UserCreateDto";
import {UserDto} from "@/dtos/user/UserDto";
import {CategoryDto} from "@/dtos/category/CategoryDto";
import {CategoryCreateDto} from "@/dtos/category/CategoryCreateDto";
import {CategoryUpdateDto} from "@/dtos/category/CategoryUpdateDto";

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

export class CategoryMapper {
    /**
     * Map từ CategoryCreateDto sang object để lưu DB
     */
    static fromCreateDto(dto: CategoryCreateDto) {
        return {
            name: dto.name,
            description: dto.description ?? null,
        };
    }

    /**
     * Map từ CategoryUpdateDto sang object để cập nhật DB
     */
    static fromUpdateDto(dto: CategoryUpdateDto) {
        return {
            name: dto.name,
            description: dto.description ?? null,
            updatedAt: new Date(),
        };
    }

    /**
     * Map từ entity trong DB sang CategoryDto
     */
    static toDto(entity: any): CategoryDto {
        return {
            id: entity.id,
            name: entity.name,
            description: entity.description,
        };
    }
}

import {RoleCreateDto} from "@/dtos/role/RoleCreateDto";
import {RoleUpdateDto} from "@/dtos/role/RoleUpdateDto";
import {RoleDto} from "@/dtos/role/RoleDto";

export class RoleMapper {
    /**
     * Map từ RoleCreateDto sang object để lưu DB
     */
    static fromCreateDto(dto: RoleCreateDto) {
        return {
            fullname: dto.fullname,
            shortname: dto.shortname,
        };
    }

    /**
     * Map từ RoleUpdateDto sang object để cập nhật DB
     */
    static fromUpdateDto(dto: RoleUpdateDto) {
        return {
            fullname: dto.fullname,
            shortname: dto.shortname,
        };
    }

    /**
     * Map từ entity trong DB sang RoleDto
     */
    static toDto(entity: any): RoleDto {
        return {
            id: entity.id,
            fullname: entity.fullname,
            shortname: entity.shortname,
            parentRoles: entity.parentRoles?.map((pr: any) => ({
                parentId: pr.parentId,
                childId: pr.childId,
            })) ?? [],
            childRoles: entity.childRoles?.map((cr: any) => ({
                parentId: cr.parentId,
                childId: cr.childId,
            })) ?? [],
        };
    }
}