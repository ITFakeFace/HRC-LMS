// src/dtos/user-role/UserRoleDto.ts
export interface UserRoleDto {
    userId: number;
    roleId: number;
    role?: any; // Có thể include role details
    user?: any; // Có thể include user details
}
