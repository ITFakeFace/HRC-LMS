// services/PermissionService.ts
import {PermissionRepository} from "@/repositories/PermissionRepository";

export class PermissionService {
    private repository: PermissionRepository;

    constructor() {
        this.repository = new PermissionRepository();
    }

    async getAllPermissions() {
        return this.repository.findAll();
    }

    async getPermissionById(id: number) {
        const permission = await this.repository.findById(id);
        if (!permission) throw new Error("Permission not found");
        return permission;
    }

    async createPermission(name: string, description?: string) {
        return this.repository.create({name, description});
    }

    async updatePermission(id: number, name?: string, description?: string) {
        return this.repository.update(id, {name, description});
    }

    async deletePermission(id: number) {
        return this.repository.delete(id);
    }
}
