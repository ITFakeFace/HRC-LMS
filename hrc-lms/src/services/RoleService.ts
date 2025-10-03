import {RoleRepository} from "@/repositories/RoleRepository";
import {RoleCreateDto} from "@/dtos/role/RoleCreateDto";
import {RoleUpdateDto} from "@/dtos/role/RoleUpdateDto";
import {Validator} from "@/utils/validator";
import {RoleMapper} from "@/utils/mapper"; // nếu bạn có mapper riêng cho Role

export class RoleService {
    private repo: RoleRepository;

    constructor() {
        this.repo = new RoleRepository();
    }

    // -----------------------------
    // Get all roles
    // -----------------------------
    async getAllRoles() {
        return this.repo.findAll();
    }

    // -----------------------------
    // Get role by ID
    // -----------------------------
    async getRoleById(id: number) {
        return this.repo.findById(id);
    }

    // -----------------------------
    // Create new role
    // -----------------------------
    async createRole(data: RoleCreateDto) {
        const errors = await Validator.validateRole(RoleMapper.toDto(data));
        if (errors.length > 0) {
            return {role: null, errors};
        }

        const newRole = {
            ...data,
        };

        const role = await this.repo.create(newRole);
        return {role, errors: []};
    }

    // -----------------------------
    // Update existing role
    // -----------------------------
    async updateRole(id: number, data: RoleUpdateDto) {
        const errors = await Validator.validateRole(RoleMapper.toDto(data));
        if (errors.length > 0) {
            return {role: null, errors};
        }

        const role = await this.repo.update(id, data);
        return {role, errors: []};
    }

    // -----------------------------
    // Delete role
    // -----------------------------
    async deleteRole(id: number) {
        if (await this.repo.findById(id) == null) {
            return {
                role: null,
                errors: [{key: "id", message: "Không tìm thấy role"}],
            };
        }
        const role = await this.repo.delete(id);
        return {role, errors: []};
    }
}
