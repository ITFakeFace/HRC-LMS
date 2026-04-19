import { PartialType } from '@nestjs/mapped-types';
import { CreateErrorReportDto } from './create-error-report.dto';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { RequestStatus } from '@prisma/client';

export class UpdateErrorReportDto extends PartialType(CreateErrorReportDto) {
  // Admin update trạng thái xử lý
  @IsOptional()
  @IsEnum(RequestStatus)
  status?: RequestStatus;

  // Admin phản hồi lại user cách sửa lỗi
  @IsOptional()
  @IsString()
  adminReply?: string;
}