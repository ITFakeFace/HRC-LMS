// Thường record tạo tự động, nhưng DTO này để đảm bảo tính nhất quán
import { IsInt, IsNotEmpty, IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { AttendanceStatus } from '@prisma/client';

export class CreateAttendanceRecordDto {
  @IsInt()
  @IsNotEmpty()
  sessionId: number;

  @IsInt()
  @IsNotEmpty()
  stdId: number;

  @IsEnum(AttendanceStatus)
  @IsOptional()
  status?: AttendanceStatus;
}