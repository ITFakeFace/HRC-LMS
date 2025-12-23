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

// Hàm helper để parse JSON an toàn
const parseJson = ({ value }: { value: any }) => {
  if (typeof value === 'string') {
    try {
      return JSON.parse(value);
    } catch (error) {
      return value; // Trả về nguyên gốc nếu lỗi parse
    }
  }
  return value;
};

// Hàm helper để parse Number từ String
const parseNumber = ({ value }: { value: any }) => {
    if (typeof value === 'string') return parseInt(value, 10);
    return value;
};

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
  // --- XỬ LÝ MẢNG JSON ---
  @IsArray()
  @IsString({ each: true })
  @Transform(parseJson) // <--- Thêm dòng này: Tự động parse "[...]" thành Array
  objectives: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @Transform(parseJson) // <--- Thêm dòng này
  audiences?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @Transform(parseJson) // <--- Thêm dòng này
  requirements?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @Transform(parseJson) // <--- Thêm dòng này
  schedule?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @Transform(parseJson) // <--- Thêm dòng này
  locations?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @Transform(parseJson) // <--- Thêm dòng này
  instructors?: string[];

  // --- XỬ LÝ OBJECT JSON ---

  @IsOptional()
  @ValidateNested()
  @Type(() => AssessmentDto)
  @Transform(parseJson) // <--- Thêm dòng này: Parse "{...}" thành Object
  assessment?: AssessmentDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => MaterialsDto)
  @Transform(parseJson) // <--- Thêm dòng này
  materials?: MaterialsDto;

  // --- XỬ LÝ CONTENTS ---
  @IsNotEmpty()
  @ValidateNested({ each: true })
  @Transform(({ value }) => {
    // 1. Parse JSON trước (vì FormData gửi lên là string)
    let data = value;
    if (typeof value === 'string') {
        try { data = JSON.parse(value); } catch(e) {}
    }

    // 2. Logic cũ: Map object -> array (nếu cần)
    if (!Array.isArray(data) && typeof data === 'object' && data !== null) {
      data = Object.keys(data).map((key) => ({
        title: key,
        topics: data[key],
      }));
    }

    // 3. Ép kiểu
    return plainToInstance(ContentItemDto, data); 
  })
  contents: ContentItemDto[];

  // --- XỬ LÝ SỐ & CATEGORIES ---

  @IsOptional()
  @IsString()
  coverImage?: string;

  @IsOptional()
  @IsInt()
  @Transform(parseNumber) // <--- Chuyển "1" thành 1
  status?: number;

  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  @Transform(parseJson) // <--- Parse "[1, 2]" thành [1, 2]
  categoryIds?: number[];
}