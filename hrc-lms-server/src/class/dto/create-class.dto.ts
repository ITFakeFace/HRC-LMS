import { IsString, IsNotEmpty, IsOptional, MaxLength, IsEnum, IsInt, IsDateString, Min, Matches } from 'class-validator';
import { ClassShift, ClassStatus } from '@prisma/client';

export class CreateClassDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  code: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name: string;

  @IsDateString()
  @IsNotEmpty()
  startDate: string; // YYYY-MM-DD

  @IsDateString()
  @IsOptional()
  endDate?: string;

  @IsInt()
  @Min(1)
  @IsNotEmpty()
  totalSessions: number;

  @IsEnum(ClassShift)
  @IsNotEmpty()
  shift: ClassShift;

  // Validate giờ dạng "HH:mm" (Ví dụ: 18:00)
  @IsString()
  @IsNotEmpty()
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, { message: 'startTime phải có định dạng HH:mm' })
  startTime: string;

  @IsString()
  @IsNotEmpty()
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, { message: 'endTime phải có định dạng HH:mm' })
  endTime: string;

  @IsEnum(ClassStatus)
  @IsOptional()
  status?: ClassStatus;

  @IsInt()
  @IsNotEmpty()
  courseId: number;

  @IsInt()
  @IsOptional()
  lecturerId?: number;
}