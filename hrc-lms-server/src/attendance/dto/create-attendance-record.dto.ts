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

  @IsString()
  @IsOptional()
  @MaxLength(255)
  note?: string;
}