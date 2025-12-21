import { IsString, IsNotEmpty, IsOptional, MaxLength, IsEnum, IsInt, IsDateString } from 'class-validator';
import { ClassStatus } from '@prisma/client';

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
  startDate: string; // ISO 8601 string (YYYY-MM-DD)

  @IsDateString()
  @IsOptional()
  endDate?: string;

  @IsEnum(ClassStatus)
  @IsOptional()
  status?: ClassStatus;

  @IsInt()
  @IsNotEmpty()
  courseId: number;
}