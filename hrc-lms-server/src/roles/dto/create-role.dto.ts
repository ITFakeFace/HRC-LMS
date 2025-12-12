import {
  IsString,
  IsNotEmpty,
  IsArray,
  IsInt,
  IsOptional,
  ArrayNotEmpty,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateRoleDto {
  @IsNotEmpty()
  @IsString()
  fullname: string; // Tên đầy đủ của Role (Ví dụ: "Quản trị viên hệ thống")

  @IsNotEmpty()
  @IsString()
  shortname: string; // Tên ngắn gọn, dùng làm key (Ví dụ: "ADMIN")

  // Mảng ID của các Permission cần gán ngay khi tạo Role (Optional)
  @IsOptional()
  @IsArray()
  @IsInt({ each: true, message: 'Permissions phải là mảng số' })
  @Type(() => Number) // Đảm bảo dữ liệu nhận vào (thường là string array) được chuyển sang number array
  permissions?: number[];

  @IsOptional()
  @IsArray()
  @IsInt({ each: true, message: 'Parent Roles phải là mảng số' })
  @Type(() => Number)
  parentRoles?: number[]; // Dùng để tạo các RoleHierarchy mới
}
