import { PartialType } from '@nestjs/mapped-types';
import { CreateClassSessionDto } from './create-class-session.dto';
import { IsBoolean, IsOptional, IsEnum } from 'class-validator';
import { SessionStatus } from '@prisma/client';

export class UpdateClassSessionDto extends PartialType(CreateClassSessionDto) {
  // Bổ sung các trường update đặc thù
  @IsEnum(SessionStatus)
  @IsOptional()
  status?: SessionStatus;

  @IsBoolean()
  @IsOptional()
  isAttendanceOpen?: boolean;
}