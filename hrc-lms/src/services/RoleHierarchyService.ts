import {RoleHierarchyRepository} from "@/repositories/RoleHierarchyRepository";
import {RoleHierarchyCreateDto} from "@/dtos/role-hierarchy/RoleHierarchyCreateDto";
import {Validator} from "@/utils/validator";

export class RoleHierarchyService {
    private repo: RoleHierarchyRepository;

    constructor() {
        this.repo = new RoleHierarchyRepository();
    }

    // -----------------------------
    // Get all role hierarchies
    // -----------------------------
    async getAll() {
        return this.repo.findAll();
    }

    // -----------------------------
    // Get role hierarchy by parentId & childId
    // -----------------------------
    async getByIds(parentId: number, childId: number) {
        return this.repo.findByIds(parentId, childId);
    }

    // -----------------------------
    // Create new role hierarchy
    // -----------------------------
    async create(data: RoleHierarchyCreateDto) {
        const errors = await Validator.validateRoleHierarchy(data);
        if (errors.length > 0) {
            return {roleHierarchy: null, errors};
        }

        // kiểm tra xem đã tồn tại quan hệ chưa
        const existing = await this.repo.findByIds(data.parentId, data.childId);
        if (existing) {
            return {
                roleHierarchy: null,
                errors: [{key: "roleHierarchy", message: "Quan hệ role đã tồn tại"}]
            };
        }

        const roleHierarchy = await this.repo.create(data);
        return {roleHierarchy, errors: []};
    }

    // -----------------------------
    // Delete role hierarchy
    // -----------------------------
    async delete(parentId: number, childId: number) {
        const errors: any[] = [];

        const existing = await this.repo.findByIds(parentId, childId);
        if (!existing) {
            return {
                roleHierarchy: null,
                errors: [{key: "roleHierarchy", message: "Không tìm thấy quan hệ role"}]
            };
        }

        const roleHierarchy = await this.repo.delete(parentId, childId);
        return {roleHierarchy, errors};
    }
}
