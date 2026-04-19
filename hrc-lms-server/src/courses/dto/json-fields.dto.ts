import { Expose } from 'class-transformer';
import { IsNotEmpty, IsString, IsArray, IsOptional } from 'class-validator';

// 1. Content: Chuẩn hóa thành dạng Mảng
export class ContentItemDto {
  @Expose()
  @IsString()
  @IsNotEmpty()
  title: string; // Ví dụ: "buổi 1"
  @Expose()
  @IsArray()
  @IsString({ each: true })
  topics: string[]; // Ví dụ: ["Tổng quan", "Quy trình"]
}

// 2. Assessment: Validate lỏng lẻo hoặc chi tiết tùy bạn
export class AssessmentDto {
  @Expose()
  @IsOptional() @IsString() part_exam?: string;
  @Expose()
  @IsOptional() @IsString() final_exam?: string;
  @Expose()
  @IsOptional() @IsString() method?: string;
}

// 3. Materials
export class MaterialsDto {
  @Expose()
  @IsOptional() @IsString() mandatory?: string;
  @Expose()
  @IsOptional() @IsString() references?: string;
  @Expose()
  @IsOptional() @IsString() software?: string;
}