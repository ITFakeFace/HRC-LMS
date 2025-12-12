import {
  IsString,
  IsEmail,
  MaxLength,
  IsBoolean,
  IsDateString,
  IsOptional,
  Matches,
  IsInt,
  IsArray,
  ArrayUnique,
} from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateUserDto {
  // ✅ THÊM pID (Personal ID)
  @IsOptional()
  @IsString()
  @MaxLength(20) // Giả định độ dài tối đa cho pID là 20
  pID?: string;

  // Các trường thông tin cơ bản
  @IsOptional()
  @IsString()
  @MaxLength(50)
  username?: string;

  @IsOptional()
  @IsString()
  @Matches(/^[0-9]{10}$/)
  phone?: string;

  @IsOptional()
  @IsEmail()
  @MaxLength(100)
  email?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  fullname?: string;

  @IsOptional()
  @IsBoolean()
  gender?: boolean; // Đã có trong DTO cũ

  @IsOptional()
  @IsDateString()
  dob?: string; // Đã có trong DTO cũ

  // ✅ THÊM avatar
  @IsOptional()
  @IsString()
  avatar?: string;

  // Cập nhật trạng thái (Chỉ Admin mới có thể cập nhật)
  @IsOptional()
  @IsBoolean()
  isEmailVerified?: boolean;

  // Lockout (Khóa tài khoản)
  @IsOptional()
  @IsDateString()
  lockoutEnd?: string;

  // Đổi mật khẩu
  @IsOptional()
  @IsString()
  @MaxLength(255)
  password?: string;

  @IsArray({ message: 'Roles must be array of number' })
  @ArrayUnique({ message: 'Roles cannot be ' })
  roles: number[];
}
