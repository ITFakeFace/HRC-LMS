import { PartialType } from '@nestjs/mapped-types';
import { CreateAttendanceSessionDto } from './create-attendance-session.dto';
import { IsDateString, IsOptional } from 'class-validator';

export class UpdateAttendanceSessionDto extends PartialType(CreateAttendanceSessionDto) {
  @IsDateString()
  @IsOptional()
  closeAt?: string;
}