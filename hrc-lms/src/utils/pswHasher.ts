import bcrypt from "bcryptjs";

export class PasswordHasher {
    static async getHashedPassword(password: string) {
        return await bcrypt.hash(password, Number(process.env.PASSWORD_SALT) || 10);
    }
}