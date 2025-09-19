export interface UserRole {
    userId: number;   // FK → Users.id
    roleId: number;   // FK → Roles.id
}