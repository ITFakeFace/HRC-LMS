import bcrypt from "bcryptjs";
import {prisma} from "@/lib/prisma";
import {signAccessToken, signRefreshToken, verifyRefreshToken} from "@/utils/jwt";
import ms from "ms";
import {UserCreateDto} from "@/dtos/user/UserCreateDto";
import {Validator} from "@/utils/validator";
import {UserMapper} from "@/utils/mapper";
import {PasswordHasher} from "@/utils/pswHasher";

export class AuthService {
    // -----------------------------
    // Register user
    // -----------------------------
    async register(data: UserCreateDto) {
        const {username, email, password, fullname, gender, dob, phone, pID, avatar} = data;

        // Check if user exists
        const errors = await Validator.validateUser(UserMapper.toDto(data));
        if (errors.length > 0) {
            return {user: null, accessToken: null, refreshToken: null, errors};
        }

        // hash password
        const hashed = await PasswordHasher.getHashedPassword(password);

        // create user with default role CUSTOMER
        const user = await prisma.user.create({
            data: {
                pID,
                username,
                email,
                phone,
                avatar,
                password: hashed,
                fullname,
                gender: Boolean(gender),
                dob: new Date(dob),
                userRoles: {
                    create: {role: {connect: {fullname: "CUSTOMER"}}},
                },
                createdAt: new Date(),
                updatedAt: new Date(),
                isEmailVerified: false,
            },
            select: {
                id: true,
                username: true,
                email: true,
                fullname: true,
                gender: true,
                dob: true,
                createdAt: true,
            },
        });

        // generate tokens
        const {accessToken, refreshToken} = await this.createTokensForUser(user, false);

        return {user, accessToken, refreshToken, errors: []};
    }


    async login(email: string, password: string, rememberMe: boolean) {
        const user = await this.validateUser(email, password);
        if (!user) return null;

        const {accessToken, refreshToken, refreshTokenExpiry} =
            await this.createTokensForUser(user, rememberMe);

        return {
            user: {
                id: user.id,
                email: user.email,
                username: user.username,
                avatar: user.avatar,
            },
            accessToken,
            refreshToken,
            refreshTokenExpiry,
        };
    }

    // -----------------------------
    // Validate user credentials (login)
    // -----------------------------
    async validateUser(email: string, password: string) {
        const user = await prisma.user.findUnique({where: {email}});
        if (!user) return null;

        const ok = await bcrypt.compare(password, user.password);
        if (!ok) return null;

        return user;
    }

    // -----------------------------
    // Create access + refresh tokens
    // -----------------------------
    async createTokensForUser(
        user: { id: number; email: string; username: string },
        rememberMe: boolean
    ) {
        const accessToken = await signAccessToken({
            sub: user.id,
            email: user.email,
            username: user.username,
        });

        const refreshTokenExpiry = rememberMe ? ms("30d") : ms("7d");

        const refreshToken = await signRefreshToken({
            sub: user.id,
            rememberMe,
        });

        // save refresh token in DB
        await prisma.refreshToken.create({
            data: {
                tokenId: refreshToken.jti,
                userId: user.id,
                expiresAt: new Date(Date.now() + refreshTokenExpiry),
            },
        });

        return {accessToken, refreshToken, refreshTokenExpiry};
    }

    // -----------------------------
    // Refresh tokens
    // -----------------------------
    async refreshTokens(oldRefreshToken: string) {
        const payload = await verifyRefreshToken(oldRefreshToken);
        if (!payload?.userId || !payload?.jti) throw new Error("Invalid refresh token");

        const userId = Number(payload.userId);
        const jti = payload.jti;

        const storedToken = await prisma.refreshToken.findUnique({where: {tokenId: jti}});
        if (!storedToken || storedToken.revoked || storedToken.expiresAt < new Date()) {
            throw new Error("Invalid or expired refresh token");
        }

        // revoke old token
        await prisma.refreshToken.update({where: {id: storedToken.id}, data: {revoked: true}});

        // create new tokens
        const accessToken = await signAccessToken({sub: userId});
        const newRefreshToken = await signRefreshToken({sub: userId});

        await prisma.refreshToken.create({
            data: {
                tokenId: newRefreshToken.jti,
                userId,
                expiresAt: new Date(Date.now() + ms("7d")),
                replacedBy: newRefreshToken.jti,
            },
        });

        const user = await prisma.user.findUnique({
            where: {id: userId},
            select: {id: true, email: true, username: true, fullname: true},
        });

        return {accessToken, refreshToken: newRefreshToken.token, user};
    }

    // -----------------------------
    // Revoke token
    // -----------------------------
    async revokeToken(jti: string) {
        await prisma.refreshToken.updateMany({where: {tokenId: jti, revoked: false}, data: {revoked: true}});
    }

    // -----------------------------
    // Revoke all tokens of a user
    // -----------------------------
    async revokeAllTokensForUser(userId: number) {
        await prisma.refreshToken.updateMany({where: {userId, revoked: false}, data: {revoked: true}});
    }
}
