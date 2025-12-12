import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class CreatePermissionDto {
  @IsNotEmpty()
  @IsString()
  name: string; // Tên quyền, thường là UNIQUE (Ví dụ: 'COURSE_CREATE', 'USER_VIEW')

  @IsOptional()
  @IsString()
  description?: string | null; // Mô tả ý nghĩa của quyền
}
