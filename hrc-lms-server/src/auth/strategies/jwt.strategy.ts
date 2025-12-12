// src/auth/strategies/jwt.strategy.ts
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { UserRepository } from 'src/users/user.repository';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(private userRepository: UserRepository) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_ACCESS_SECRET || 'YOUR_DEFAULT_ACCESS_SECRET',
    });
  }

  async validate(payload: { sub: number; username: string }) {
    const user = await this.userRepository.findById(payload.sub);
    
    if (!user) {
        throw new UnauthorizedException('Token không hợp lệ hoặc User không tồn tại');
    }
    
    // Đính kèm thông tin user vào req.user (không bao gồm password)
    const { password, ...result } = user;
    return result; 
  }
}