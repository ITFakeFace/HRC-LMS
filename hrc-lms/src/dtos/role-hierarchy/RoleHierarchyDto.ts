// src/dtos/roleHierarchy/RoleHierarchyDto.ts
export interface RoleHierarchyDto {
    parentId: number;
    childId: number;
    parent?: any; // có thể map về RoleDto nếu bạn muốn
    child?: any;  // có thể map về RoleDto nếu bạn muốn
}