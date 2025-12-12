// src/users/refresh-token.repository.ts
import { Injectable } from '@nestjs/common';
import { Prisma, RefreshToken } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';

type RefreshTokenWithUser = Prisma.RefreshTokenGetPayload<{
    include: { user: true }
}>;

@Injectable()
export class RefreshTokenRepository {
  constructor(private prisma: PrismaService) {}

  async createToken(userId: number, jti: string, expiresAt: Date): Promise<RefreshToken> {
    return this.prisma.refreshToken.create({
      data: {
        userId,
        jti,
        expiresAt,
        // (Có thể thêm ipAddress, userAgent nếu có)
      },
    });
  }

  async findTokenByJti(jti: string): Promise<RefreshTokenWithUser | null> {
    return this.prisma.refreshToken.findUnique({
      where: { jti },
      include: { user: true }, // Vẫn giữ include: { user: true }
    });
  }

  async revokeToken(jti: string, replacedByTokenId?: string): Promise<RefreshToken> {
    return this.prisma.refreshToken.update({
      where: { jti },
      data: {
        isRevoked: true,
        replacedByTokenId,
      },
    });
  }
}