import { PartialType } from '@nestjs/mapped-types';
import { CreateAttendanceRecordDto } from './create-attendance-record.dto';
import { IsString, MaxLength, IsOptional } from 'class-validator';

export class UpdateAttendanceRecordDto extends PartialType(CreateAttendanceRecordDto) {
  @IsString()
  @IsOptional()
  @MaxLength(255)
  note?: string;
}