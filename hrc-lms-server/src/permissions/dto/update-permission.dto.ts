import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class UpdatePermissionDto {
  @IsNotEmpty()
  @IsNumber()
  id: number;

  @IsNotEmpty()
  @IsString()
  name: string; // Tên quyền, thường là UNIQUE (Ví dụ: 'COURSE_CREATE', 'USER_VIEW')

  @IsOptional()
  @IsString()
  description?: string | null; // Mô tả ý nghĩa của quyền
}
