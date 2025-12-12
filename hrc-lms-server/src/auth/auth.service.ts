// src/auth/auth.service.ts
import {
  Injectable,
  UnauthorizedException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UserRepository } from '../users/user.repository';
import { RefreshTokenRepository } from '../users/refresh-token.repository/refresh-token.repository.service';
import { User, Prisma } from '@prisma/client';
import { RegisterDto } from './dto/register.dto/register.dto';
import { RoleRepository } from 'src/roles/role.repository';
import { ResponseLoginDto } from './dto/login.dto/response-login.dto';
import { PermissionRepository } from 'src/permissions/permission.repository';
import { UserMapper } from 'src/users/mapper/user.mapper';

// Định nghĩa kiểu dữ liệu cho Payload của Access Token để sử dụng lại
export interface AccessTokenPayload {
  username: string;
  sub: number; // User ID
  roles: string[];
  permissions: string[];
  iat: number;
  exp: number;
}

@Injectable()
export class AuthService {
  constructor(
    private userRepository: UserRepository,
    private roleRepository: RoleRepository,
    private permRepository: PermissionRepository,
    private refreshTokenRepository: RefreshTokenRepository,
    private jwtService: JwtService,
  ) {}

  // 1. Tạo cặp Token mới
  async getNewTokens(
    user: Prisma.UserGetPayload<{ include: { roles: true } }>,
  ) {
    // Payload cho Access Token
    const payload = {
      username: user.username,
      sub: user.id,
      roles: user.roles.map((role) => role.shortname),
    };

    // 1. Tạo Access Token (Ngắn hạn)
    const accessToken = this.jwtService.sign(payload, {
      secret: process.env.JWT_ACCESS_SECRET || 'YOUR_DEFAULT_ACCESS_SECRET',
      expiresIn: '15m',
    });

    // 2. Tạo Refresh Token (Dài hạn)
    const jti =
      Math.random().toString(36).substring(2, 15) +
      Math.random().toString(36).substring(2, 15);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 ngày

    const refreshToken = this.jwtService.sign(
      { sub: user.id, jti },
      {
        secret: process.env.JWT_REFRESH_SECRET || 'YOUR_DEFAULT_REFRESH_SECRET',
        expiresIn: '7d',
      },
    );

    // 3. Lưu Refresh Token vào DB
    await this.refreshTokenRepository.createToken(user.id, jti, expiresAt);

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
    };
  }

  // 2. Đăng nhập
  async login(email: string, pass: string): Promise<ResponseLoginDto> {
    const user = await this.userRepository.findByEmail(email);
    const res = new ResponseLoginDto();
    if (!user || !(await bcrypt.compare(pass, user.password))) {
      res.pushError({
        key: 'global',
        value: 'Email or Password not match',
      });
      return res;
    }

    // Kiểm tra các điều kiện khác (ví dụ: isEmailVerified, lockoutEnd)
    if (user && user.lockoutEnd) {
      res.pushError({
        key: 'global',
        value: 'Account is locked',
      });
      return res;
    }
    const tokens = await this.getNewTokens(user);
    res.accessToken = tokens.access_token;
    res.refreshToken = tokens.refresh_token;
    res.user = UserMapper.fromModelToDto(user);
    res.user.permissions = (
      await this.userRepository.getPermissionsByUserId(user.id)
    ).map((perm) => perm.name);
    res.user.roles = (await this.userRepository.getRolesByUserId(user.id)).map(
      (role) => role.shortname,
    );
    // Tạo và trả về cặp token
    return res;
  }

  // 3. Xử lý Refresh Token
  async refreshTokens(payload: { userId: number; jti: string; user: User }) {
    // 1. Thu hồi token cũ (để ngăn chặn Replay Attacks)
    await this.refreshTokenRepository.revokeToken(payload.jti);

    // 2. Lấy lại thông tin user với roles (dùng UserRepository)
    const user = await this.userRepository.findById(payload.userId);

    if (!user) {
      throw new UnauthorizedException('User không tồn tại.');
    }

    // 3. Tạo và trả về cặp token mới
    return this.getNewTokens(user);
  }

  decodeAccessToken(token: string): AccessTokenPayload {
    try {
      const payload = this.jwtService.decode(token) as AccessTokenPayload;

      // Kiểm tra xem token có phải là token Access hợp lệ không (cấu trúc cơ bản)
      if (!payload || !payload.sub || !payload.roles) {
        throw new UnauthorizedException(
          'Token không hợp lệ (cấu trúc payload).',
        );
      }

      // **Quan trọng:** Hàm decode() KHÔNG kiểm tra chữ ký (signature) hoặc thời gian hết hạn (expiration).
      // Đây là lý do nó thường chỉ dùng để LẤY DỮ LIỆU CÔNG KHAI.
      // Đối với xác thực bảo mật, bạn phải dùng hàm verify() của JwtService
      // hoặc dùng JwtAuthGuard (Passport/NestJS) để đảm bảo token là thật và còn hạn.

      return payload;
    } catch (error) {
      // Trong trường hợp token không đúng định dạng JWT
      throw new UnauthorizedException('Token không đúng định dạng JWT.');
    }
  }

  // 4. Đăng ký người dùng
  async register(registerDto: RegisterDto) {
    // 1. Kiểm tra email/username/pID đã tồn tại chưa (Sử dụng UserRepository)
    const existingUser = await this.userRepository.findByEmail(
      registerDto.email,
    );
    if (existingUser) {
      throw new ForbiddenException('Email đã tồn tại.');
    }
    // (Thêm kiểm tra cho username và pID)

    // 2. Mã hóa mật khẩu
    const hashedPassword = await bcrypt.hash(registerDto.password, 10);

    // 3. Chuẩn bị dữ liệu tạo User
    const userData: Prisma.UserCreateInput = {
      ...registerDto,
      password: hashedPassword,
      dob: new Date(registerDto.dob), // Chuyển string DTO sang Date object
      // Các trường tự động (createdAt, updatedAt) sẽ được Prisma xử lý
      // isEmailVerified mặc định là false, lockoutEnd là null
      updatedAt: new Date(),
    };

    // 4. Gọi Repository để tạo User
    const newUser = await this.userRepository.create(userData);

    // 5. (Tùy chọn) Gán Role mặc định (ví dụ: 'CLIENT') cho User mới tạo
    // (Đây là logic cấp cao, yêu cầu tương tác với model UserRole và Role)
    // await this.prisma.userRole.create(...)

    // Loại bỏ password trước khi trả về
    const { password, ...result } = newUser;
    return result;
  }

  // 👇 HÀM GET ME ĐÃ SỬA ĐỔI
  async getMe(userId: number) {
    // 1. Lấy thông tin User và Roles
    const user = await this.userRepository.findById(userId);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // 2. Lấy Permissions (Phải gọi hàm riêng vì logic đệ quy SQL phức tạp)
    const permissionsObj =
      await this.userRepository.getPermissionsByUserId(userId);

    // 3. Flatten (Làm phẳng) dữ liệu

    // Map Roles: Kiểm tra xem trong Prisma Model, field tên role là 'name' hay 'shortname'
    // Dựa vào code getRolesByUserId của bạn, mình đoán là 'shortname' hoặc 'fullname'
    // Ở đây mình dùng r['shortname'] hoặc r['name'] để an toàn.
    const roleNames = user.roles
      ? user.roles.map((r: any) => r.shortname || r.name)
      : [];

    // Map Permissions: Query SQL của bạn select P.name, nên ta map p.name
    const permissionNames = permissionsObj.map((p) => p.name);

    // 4. Trả về kết quả
    return {
      id: user.id,
      pID: user.pID,
      username: user.username,
      phone: user.phone,
      email: user.email,
      fullname: user.fullname,
      avatar: user.avatar,
      dob: user.dob,
      gender: user.gender,
      lockoutEnd: user.lockoutEnd,
      isEmailVerified: user.isEmailVerified,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      roles: roleNames, // VD: ['SUPER_ADMIN']
      permissions: permissionNames, // VD: ['VIEW_USERS', 'DELETE_USERS']
    };
  }
}
