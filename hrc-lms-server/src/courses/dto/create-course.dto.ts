// create-course.dto.ts
import { 
  IsNotEmpty, 
  IsString, 
  MaxLength, 
  IsOptional, 
  IsArray, 
  ValidateNested, 
  IsInt, 
  // IsBase64 -> XÓA CÁI NÀY
} from 'class-validator';
import { Type, Transform, plainToInstance } from 'class-transformer';
import { ContentItemDto, AssessmentDto, MaterialsDto } from './json-fields.dto';

export class CreateCourseDto {
  // ... (Các trường code, name, description giữ nguyên) ...
  @IsString()
  @IsNotEmpty()
  code: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  duration?: string;

  // ... (Các trường JSON Array giữ nguyên) ...
  @IsArray()
  @IsString({ each: true })
  objectives: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  audiences?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  requirements?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  schedule?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  locations?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  instructors?: string[];

  // ... (Các trường JSON Object Assessment/Materials giữ nguyên) ...
  @IsOptional()
  @ValidateNested()
  @Type(() => AssessmentDto)
  assessment?: AssessmentDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => MaterialsDto)
  materials?: MaterialsDto;

  // ... (Trường Contents giữ nguyên Logic cũ) ...
  @IsNotEmpty()
  @ValidateNested({ each: true })
  @Transform(({ value }) => {
    let data = value;
    if (!Array.isArray(data) && typeof data === 'object' && data !== null) {
      data = Object.keys(data).map((key) => ({
        title: key,
        topics: data[key],
      }));
    }
    return plainToInstance(ContentItemDto, data); 
  })
  contents: ContentItemDto[];

  // --- HÌNH ẢNH (PHẦN QUAN TRỌNG ĐÃ SỬA) ---

  @IsOptional()
  @IsString() // Đổi thành String thường, vì nó sẽ là đường dẫn file (VD: /public/...)
  // @IsBase64() -> XÓA DÒNG NÀY
  coverImage?: string;

  @IsOptional()
  @IsInt()
  status?: number;

  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  categoryIds?: number[];
}