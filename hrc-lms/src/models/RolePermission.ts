export interface RolePermission {
    roleId: number;         // FK → Roles.id
    permissionId: number;   // FK → Permissions.id
}