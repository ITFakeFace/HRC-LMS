// schemas/Auth.schema.js
import {z} from "zod";

export const LoginSchema = z.object({
    identifier: z.string().min(3, 'Username or Email is required.'),
    password: z.string().min(6, 'Password must be at least 6 characters.'),
    rememberMe: z.boolean().optional().default(false),
});

export const RegisterSchema = z.object({
    email: z.string().email('Invalid email address.'),
    password: z.string().min(8, 'Password must be at least 8 characters.'),
    // Bạn có thể thêm các trường khác như name, username, v.v.
    name: z.string().min(2, 'Name is required.').optional(),
});

export const RefreshTokenSchema = z.object({
    refreshToken: z.string(),
});