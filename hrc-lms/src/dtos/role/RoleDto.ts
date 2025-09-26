// src/dtos/role/RoleDto.ts
export interface RoleDto {
    id: number;
    fullname: string;
    shortname: string;
    parentRoles?: {
        parentId: number;
        childId: number;
    }[];
    childRoles?: {
        parentId: number;
        childId: number;
    }[];
}