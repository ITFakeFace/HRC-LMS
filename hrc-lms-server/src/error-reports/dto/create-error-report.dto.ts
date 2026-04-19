import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateErrorReportDto {
  @IsNotEmpty({ message: 'Tiêu đề lỗi không được để trống' })
  @IsString()
  @MaxLength(255, { message: 'Tiêu đề quá dài' })
  title: string;

  @IsNotEmpty({ message: 'Mô tả lỗi không được để trống' })
  @IsString()
  content: string;

  // Ảnh chụp màn hình lỗi
  @IsOptional()
  @IsString()
  image?: string;
}