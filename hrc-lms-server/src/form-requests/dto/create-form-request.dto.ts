import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateFormRequestDto {
  @IsNotEmpty({ message: 'Tiêu đề không được để trống' })
  @IsString()
  @MaxLength(255, { message: 'Tiêu đề không được quá 255 ký tự' })
  title: string;

  @IsNotEmpty({ message: 'Nội dung không được để trống' })
  @IsString()
  content: string;

  // Ảnh minh chứng (Optional vì controller sẽ xử lý upload riêng)
  @IsOptional()
  @IsString()
  image?: string;
}