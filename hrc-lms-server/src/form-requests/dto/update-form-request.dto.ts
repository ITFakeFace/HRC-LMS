import { PartialType } from '@nestjs/mapped-types';
import { CreateFormRequestDto } from './create-form-request.dto';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { RequestStatus } from '@prisma/client';

export class UpdateFormRequestDto extends PartialType(CreateFormRequestDto) {
  // Dành cho Admin khi xử lý yêu cầu
  @IsOptional()
  @IsEnum(RequestStatus, { message: 'Trạng thái không hợp lệ (PENDING, RESOLVED, REJECTED)' })
  status?: RequestStatus;

  @IsOptional()
  @IsString()
  adminNote?: string;
}