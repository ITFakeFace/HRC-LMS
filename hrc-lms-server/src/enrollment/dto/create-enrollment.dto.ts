import { IsInt, IsNotEmpty, IsEnum, IsOptional } from 'class-validator';
import { EnrollmentStatus } from '@prisma/client';

export class CreateEnrollmentDto {
  @IsInt()
  @IsNotEmpty()
  studentId: number;

  @IsInt()
  @IsNotEmpty()
  classId: number;

  @IsEnum(EnrollmentStatus)
  @IsOptional()
  status?: EnrollmentStatus;
}