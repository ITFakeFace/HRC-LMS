// src/services/RoleService.ts

import {RoleRepository} from "@/repositories/RoleRepository";
import {RoleCreateDto} from "@/dtos/role/RoleCreateDto";
import {RoleUpdateDto} from "@/dtos/role/RoleUpdateDto";
import {Validator} from "@/utils/validator";
import {RoleMapper} from "@/utils/mapper"; // nếu bạn có mapper riêng cho Role
// 💡 Lưu ý: Cần đảm bảo RoleRepository đã có phương thức createRoleWithRelations(data)

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
    // Create new role (Đã chỉnh sửa để dùng Repository)
    // -----------------------------
    async createRole(data: RoleCreateDto) {
        // 1. Validate DTO
        // 1. Validate DTO (Chỉ truyền các trường cơ bản cần validate)
        const baseRoleData = RoleMapper.fromCreateDto(data);
        const errors = await Validator.validateRole(baseRoleData);
        if (errors.length > 0) {
            return {role: null, errors};
        }

        // 2. Gọi Repository để thực hiện Transactional Create
        try {
            // ✅ Sử dụng phương thức tạo role phức tạp của Repository
            const role = await this.repo.createRoleWithRelations(data);

            // 3. Trả về thành công
            return {role, errors: []};

        } catch (error: any) {
            // Xử lý lỗi trùng lặp (P2002)
            if (error.code === 'P2002') {
                const target = error.meta?.target || [];
                if (target.includes('shortname')) {
                    return {role: null, errors: [{key: "shortname", message: "Tên viết tắt đã tồn tại"}]};
                }
                if (target.includes('fullname')) {
                    return {role: null, errors: [{key: "fullname", message: "Tên đầy đủ đã tồn tại"}]};
                }
            }

            // Xử lý lỗi tham chiếu (P2003) - Khi ID role cha hoặc permission không tồn tại
            if (error.code === 'P2003') {
                return {
                    role: null,
                    errors: [{key: "relations", message: "ID Role cha hoặc Permission được chọn không tồn tại."}]
                };
            }

            // Lỗi chung khác
            console.error("Lỗi tạo Role:", error);
            return {role: null, errors: [{key: "system", message: "Lỗi hệ thống không xác định: " + error.message}]};
        }
    }

    // -----------------------------
    // Update existing role
    // -----------------------------
    async updateRole(id: number, data: RoleUpdateDto) {
        // 💡 Giả sử RoleMapper.toDto(data) trích xuất dữ liệu cần thiết cho validation
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
        // Kiểm tra tồn tại qua Repository
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