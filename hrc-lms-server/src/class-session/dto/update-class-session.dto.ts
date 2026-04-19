import { PartialType } from '@nestjs/mapped-types';
import { CreateClassSessionDto } from './create-class-session.dto';
import { IsBoolean, IsOptional, IsEnum, IsString } from 'class-validator';
import { SessionStatus } from '@prisma/client';

export class UpdateClassSessionDto extends PartialType(CreateClassSessionDto) {
  // Admin có thể đổi trạng thái thủ công (VD: Cancel buổi học)
  @IsEnum(SessionStatus)
  @IsOptional()
  status?: SessionStatus;

  // Admin tắt/mở điểm danh thủ công (Emergency)
  @IsBoolean()
  @IsOptional()
  isAttendanceOpen?: boolean;

  // [Gợi ý thêm]
  // Đôi khi Admin cần sửa tay mã attendanceCode nếu hệ thống sinh mã bị lỗi hiển thị
  @IsString()
  @IsOptional()
  attendanceCode?: string; 
}