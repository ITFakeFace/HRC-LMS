export interface RoleHierarchy {
    parentId: number;     // FK → Role.id
    childId: number;      // FK → Role.id
}