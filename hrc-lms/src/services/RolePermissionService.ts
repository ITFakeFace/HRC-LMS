import {RolePermissionRepository} from "@/repositories/RolePermissionRepository";
import {RolePermissionCreateDto} from "@/dtos/role-permission/RolePermissionCreateDto";
import {RolePermissionDto} from "@/dtos/role-permission/RolePermissionDto";

export class RolePermissionService {
    private repo: RolePermissionRepository;

    constructor() {
        this.repo = new RolePermissionRepository();
    }

    // -----------------------------
    // Gán quyền vào role
    // -----------------------------
    async addPermissionToRole(data: RolePermissionCreateDto) {
        const errors: any[] = [];

        // check tồn tại
        const exists = await this.repo.exists(data.roleId, data.permissionId);
        if (exists) {
            errors.push({
                key: "role_permission",
                message: "Permission đã tồn tại trong role này",
            });
            return {rolePermission: null, errors};
        }

        const rolePermission = await this.repo.add(data);
        const dto: RolePermissionDto = {
            roleId: rolePermission.roleId,
            permissionId: rolePermission.permissionId,
            roleName: rolePermission.role.fullname,
            permissionName: rolePermission.permission.name,
        };

        return {rolePermission: dto, errors: []};
    }

    // -----------------------------
    // Gỡ quyền khỏi role
    // -----------------------------
    async removePermissionFromRole(roleId: number, permissionId: number) {
        const errors: any[] = [];

        const exists = await this.repo.exists(roleId, permissionId);
        if (!exists) {
            errors.push({
                key: "role_permission",
                message: "Permission không tồn tại trong role này",
            });
            return {rolePermission: null, errors};
        }

        const removed = await this.repo.remove(roleId, permissionId);
        const dto: RolePermissionDto = {
            roleId: removed.roleId,
            permissionId: removed.permissionId,
            roleName: removed.role.fullname,
            permissionName: removed.permission.name,
        };

        return {rolePermission: dto, errors: []};
    }

    // -----------------------------
    // Lấy tất cả permission theo role
    // -----------------------------
    async getPermissionsByRole(roleId: number) {
        const permissions = await this.repo.findByRole(roleId);
        return permissions.map((rp) => ({
            roleId: rp.roleId,
            permissionId: rp.permissionId,
            permissionName: rp.permission.name,
        }));
    }

    // -----------------------------
    // Lấy tất cả role theo permission
    // -----------------------------
    async getRolesByPermission(permissionId: number) {
        const roles = await this.repo.findByPermission(permissionId);
        return roles.map((rp) => ({
            roleId: rp.roleId,
            permissionId: rp.permissionId,
            roleName: rp.role.fullname,
        }));
    }
}
