import bcrypt from "bcryptjs";
import {UserRepository} from "@/repositories/UserRepository";
import {UserCreateDto} from "@/dtos/user/UserCreateDto";
import {UserUpdateDto} from "@/dtos/user/UserUpdateDto";
import {PasswordHasher} from "@/utils/pswHasher";
import {Validator} from "@/utils/validator";
import {UserMapper} from "@/utils/mapper";

export class UserService {
    private repo: UserRepository;

    constructor() {
        this.repo = new UserRepository();
    }

    // -----------------------------
    // Get all users
    // -----------------------------
    async getAllUsers() {
        return this.repo.findAll();
    }

    // -----------------------------
    // Get user by ID
    // -----------------------------
    async getUserById(id: number) {
        return this.repo.findById(id);
    }

    // -----------------------------
    // Create new user
    // -----------------------------
    async createUser(data: UserCreateDto) {
        // hash password
        const hashedPassword = await PasswordHasher.getHashedPassword(data.password)
        const errors = await Validator.validateUser(UserMapper.toDto(data));
        if (errors.length > 0)
            return {user: null, errors};
        // set default values
        const newUser = {
            ...data,
            password: hashedPassword,
            createdAt: new Date(),
            updatedAt: new Date(),
            isEmailVerified: false,
        }
        return {user: this.repo.create(newUser), errors: []};
    }

    // -----------------------------
    // Update existing user
    // -----------------------------
    async updateUser(id: string, data: UserUpdateDto) {
        // Nếu có mật khẩu mới thì hash
        const updatedData: any = {...data};
        if (data.password) {
            updatedData.password = await PasswordHasher.getHashedPassword(data.password);
        }

        // Validate dữ liệu update
        const errors = await Validator.validateUser(UserMapper.toDto(updatedData));
        if (errors.length > 0) {
            return {user: null, errors};
        }

        // Gán updatedAt
        updatedData.updatedAt = new Date();

        // Update trong repo
        const user = await this.repo.update(Number(id), updatedData);

        return {user, errors: []};
    }

    // -----------------------------
    // Delete user
    // -----------------------------
    async deleteUser(id: number) {
        const errors = [];
        if (await this.repo.findById(id) == null)
            return {
                user: null, errors: [{key: "id", message: "Không tìm thấy tải khoản"}]
            };
        return {user: this.repo.delete(id), errors: []};
    }
}
