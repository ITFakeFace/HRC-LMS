// src/dtos/role/RoleCreateDto.ts
export interface RoleCreateDto {
    fullname: string;
    shortname: string;
    parentRoles: number[];   // Mảng ID của các role cha
    permissions: number[];   // Mảng ID của các permission
}