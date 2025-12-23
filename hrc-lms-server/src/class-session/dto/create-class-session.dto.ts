// Thường session được tạo tự động, nhưng DTO này dùng cho trường hợp tạo thủ công (Make-up class)
import { IsInt, IsNotEmpty, IsDateString, IsString, IsOptional, IsEnum } from 'class-validator';
import { SessionStatus } from '@prisma/client';

export class CreateClassSessionDto {
  @IsInt()
  @IsNotEmpty()
  classId: number;

  @IsInt()
  @IsNotEmpty()
  sessionNumber: number;

  @IsDateString()
  @IsNotEmpty()
  date: string; // YYYY-MM-DD

  @IsDateString()
  @IsNotEmpty()
  startTime: string; // ISO DateTime

  @IsDateString()
  @IsNotEmpty()
  endTime: string; // ISO DateTime

  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  description?: string;
}