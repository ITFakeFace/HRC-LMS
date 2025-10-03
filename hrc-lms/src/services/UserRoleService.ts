// src/services/UserRoleService.ts
import {UserRoleRepository} from "@/repositories/UserRoleRepository";
import {UserRoleCreateDto} from "@/dtos/user-role/UserRoleCreateDto";
import {Validator} from "@/utils/validator";

export class UserRoleService {
    private repo: UserRoleRepository;

    constructor() {
        this.repo = new UserRoleRepository();
    }

    // -----------------------------
    // Get all user-role relationships
    // -----------------------------
    async getAll() {
        return this.repo.findAll();
    }

    // -----------------------------
    // Get user-role by userId & roleId
    // -----------------------------
    async getByIds(userId: number, roleId: number) {
        return this.repo.findByIds(userId, roleId);
    }

    // -----------------------------
    // Add role to user
    // -----------------------------
    async addRoleToUser(data: UserRoleCreateDto) {
        const errors = await Validator.validateUserRole(data);
        if (errors.length > 0) {
            return {userRole: null, errors};
        }

        // Kiểm tra xem đã tồn tại chưa
        const existing = await this.repo.findByIds(data.userId, data.roleId);
        if (existing) {
            return {
                userRole: null,
                errors: [{key: "userRole", message: "User đã có role này"}],
            };
        }

        const userRole = await this.repo.create(data);
        return {userRole, errors: []};
    }

    // -----------------------------
    // Remove role from user
    // -----------------------------
    async removeRoleFromUser(userId: number, roleId: number) {
        const errors: any[] = [];

        const existing = await this.repo.findByIds(userId, roleId);
        if (!existing) {
            return {
                userRole: null,
                errors: [{key: "userRole", message: "Không tìm thấy role của user"}],
            };
        }

        const userRole = await this.repo.delete(userId, roleId);
        return {userRole, errors};
    }

    // -----------------------------
    // Get all roles of a user
    // -----------------------------
    async getRolesByUser(userId: number) {
        return this.repo.findRolesByUserId(userId);
    }

    // -----------------------------
    // Get all users of a role
    // -----------------------------
    async getUsersByRole(roleId: number) {
        return this.repo.findUsersByRoleId(roleId);
    }
}
