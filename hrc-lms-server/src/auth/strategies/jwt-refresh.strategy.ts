// src/auth/strategies/jwt-refresh.strategy.ts
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { RefreshTokenRepository } from '../../users/refresh-token.repository/refresh-token.repository.service';

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(Strategy, 'jwt-refresh') {
  constructor(private refreshTokenRepository: RefreshTokenRepository) {
    super({
      jwtFromRequest: ExtractJwt.fromBodyField('refreshToken'), // Lấy token từ body (hoặc cookie)
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_REFRESH_SECRET || 'YOUR_DEFAULT_REFRESH_SECRET',
    });
  }

  // Payload: { sub: userId, jti: jti_token }
  async validate(payload: any) {
    // Gọi Repository. Lúc này tokenRecord đã có trường user
    const tokenRecord = await this.refreshTokenRepository.findTokenByJti(payload.jti);

    if (!tokenRecord || tokenRecord.isRevoked || !tokenRecord.user) { // Kiểm tra tokenRecord.user
      throw new UnauthorizedException('Refresh Token đã bị thu hồi hoặc không hợp lệ');
    }
    
    // Trả về thông tin cần thiết
    return { 
        userId: payload.sub, 
        jti: payload.jti,
        user: tokenRecord.user // **Lỗi đã được khắc phục**
    };
  }
}