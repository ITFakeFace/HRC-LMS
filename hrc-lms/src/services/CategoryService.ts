import {CategoryRepository} from "@/repositories/CategoryRepository";
import {CategoryCreateDto} from "@/dtos/category/CategoryCreateDto";
import {CategoryUpdateDto} from "@/dtos/category/CategoryUpdateDto";

export class CategoryService {
    private repo: CategoryRepository;

    constructor() {
        this.repo = new CategoryRepository();
    }

    // -----------------------------
    // Get all categories
    // -----------------------------
    async getAllCategories() {
        return this.repo.findAll();
    }

    // -----------------------------
    // Get category by ID
    // -----------------------------
    async getCategoryById(id: number) {
        return this.repo.findById(id);
    }

    // -----------------------------
    // Create new category
    // -----------------------------
    async createCategory(data: CategoryCreateDto) {
        const errors: any[] = [];

        // Validate dữ liệu đầu vào (nếu có Validator thì gắn thêm ở đây)
        if (!data.name || data.name.trim() === "") {
            errors.push({key: "name", message: "Tên category không được để trống"});
        }

        if (errors.length > 0) {
            return {category: null, errors};
        }

        const newCategory = {
            ...data,
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        const category = await this.repo.create(newCategory);
        return {category, errors: []};
    }

    // -----------------------------
    // Update existing category
    // -----------------------------
    async updateCategory(id: number, data: CategoryUpdateDto) {
        const errors: any[] = [];

        // Nếu không có category trong DB thì trả lỗi
        const existing = await this.repo.findById(id);
        if (!existing) {
            errors.push({key: "id", message: "Không tìm thấy category"});
            return {category: null, errors};
        }

        // Validate
        if (data.name !== undefined && data.name.trim() === "") {
            errors.push({key: "name", message: "Tên category không được để trống"});
        }

        if (errors.length > 0) {
            return {category: null, errors};
        }

        const updatedData = {
            ...data,
            updatedAt: new Date(),
        };

        if (!updatedData.id) updatedData.id = id;

        const category = await this.repo.update(updatedData);
        return {category, errors: []};
    }

    // -----------------------------
    // Delete category
    // -----------------------------
    async deleteCategory(id: number) {
        const errors: any[] = [];

        if (await this.repo.findById(id) == null) {
            errors.push({key: "id", message: "Không tìm thấy category"});
            return {category: null, errors};
        }

        const category = await this.repo.delete(id);
        return {category, errors: []};
    }
}
