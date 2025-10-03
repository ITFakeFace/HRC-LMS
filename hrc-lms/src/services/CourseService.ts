import {CourseRepository} from "@/repositories/CourseRepository";
import {CourseCreateDto} from "@/dtos/course/CourseCreateDto";
import {CourseUpdateDto} from "@/dtos/course/CourseUpdateDto";

export class CourseService {
    private repo: CourseRepository;

    constructor() {
        this.repo = new CourseRepository();
    }

    // -----------------------------
    // Get all courses
    // -----------------------------
    async getAllCourses() {
        return this.repo.getAll();
    }

    // -----------------------------
    // Get course by ID
    // -----------------------------
    async getCourseById(id: number) {
        return this.repo.getById(id);
    }

    // -----------------------------
    // Create new course
    // -----------------------------
    async createCourse(data: CourseCreateDto) {
        const errors: any[] = [];

        // Validate dữ liệu đầu vào
        if (!data.name || data.name.trim() === "") {
            errors.push({key: "name", message: "Tên course không được để trống"});
        }
        if (!data.description || data.description.trim() === "") {
            errors.push({key: "description", message: "Mô tả không được để trống"});
        }
        if (!data.creatorId) {
            errors.push({key: "creatorId", message: "creatorId là bắt buộc"});
        }
        if (!data.lastEditor) {
            errors.push({key: "lastEditor", message: "lastEditor là bắt buộc"});
        }
        if (!data.categories || data.categories.length === 0) {
            errors.push({key: "categories", message: "Phải có ít nhất 1 category"});
        }

        if (errors.length > 0) {
            return {course: null, errors};
        }

        const course = await this.repo.create(data);
        return {course, errors: []};
    }

    // -----------------------------
    // Update existing course
    // -----------------------------
    async updateCourse(id: number, data: CourseUpdateDto) {
        const errors: any[] = [];

        // Kiểm tra tồn tại
        const existing = await this.repo.getById(id);
        if (!existing) {
            errors.push({key: "id", message: "Không tìm thấy course"});
            return {course: null, errors};
        }

        // Validate (nếu field truyền vào nhưng rỗng)
        if (data.name !== undefined && data.name.trim() === "") {
            errors.push({key: "name", message: "Tên course không được để trống"});
        }
        if (data.description !== undefined && data.description.trim() === "") {
            errors.push({key: "description", message: "Mô tả không được để trống"});
        }

        if (errors.length > 0) {
            return {course: null, errors};
        }

        const course = await this.repo.update(id, data);
        return {course, errors: []};
    }

    // -----------------------------
    // Delete course
    // -----------------------------
    async deleteCourse(id: number) {
        const errors: any[] = [];

        // Kiểm tra tồn tại
        if (await this.repo.getById(id) == null) {
            errors.push({key: "id", message: "Không tìm thấy course"});
            return {course: null, errors};
        }

        const course = await this.repo.delete(id);
        return {course, errors: []};
    }
}
