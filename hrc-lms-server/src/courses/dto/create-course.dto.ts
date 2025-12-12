import { 
  IsNotEmpty, 
  IsString, 
  MaxLength, 
  IsOptional, 
  IsArray, 
  ValidateNested, 
  IsInt, 
  IsBase64 
} from 'class-validator';
import { Type, Transform, plainToInstance } from 'class-transformer';
import { ContentItemDto, AssessmentDto, MaterialsDto } from './json-fields.dto';

export class CreateCourseDto {
  // --- CỘT CỨNG (Identity) ---
  @IsString()
  @IsNotEmpty({ message: 'Mã khóa học không được để trống' })
  @MaxLength(50)
  code: string; // HRC-RS01

  @IsString()
  @IsNotEmpty({ message: 'Tên khóa học không được để trống' })
  @MaxLength(255)
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  duration?: string;

  // --- CỘT JSON (Flexible Arrays) ---
  
  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty()
  objectives: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  audiences?: string[]; // Map với targetLearners cũ

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

  // --- CỘT JSON (Complex Objects) ---

  @IsOptional()
  @ValidateNested()
  @Type(() => AssessmentDto) // <--- BẮT BUỘC PHẢI CÓ
  assessment?: AssessmentDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => MaterialsDto) // <--- BẮT BUỘC PHẢI CÓ
  materials?: MaterialsDto;

  // --- MAGIC TRANSFORM: Contents ---
  @IsNotEmpty()
  @ValidateNested({ each: true })
  @Transform(({ value }) => {
    let data = value;

    // 1. Logic cũ: Nếu là Object -> Chuyển thành Array
    if (!Array.isArray(data) && typeof data === 'object' && data !== null) {
      data = Object.keys(data).map((key) => ({
        title: key,
        topics: data[key],
      }));
    }

    // 2. Logic Mới: Ép kiểu thủ công sang Class ngay tại đây
    // Thay vì để @Type bên ngoài đoán, ta ép trực tiếp nó thành ContentItemDto
    return plainToInstance(ContentItemDto, data); 
  })
  // @Type(() => ContentItemDto)  <--- XÓA DÒNG NÀY ĐI (Vì đã làm ở trên rồi)
  contents: ContentItemDto[];

  // --- HÌNH ẢNH & QUAN HỆ ---

  @IsOptional()
  @IsBase64()
  coverImage?: string;

  @IsOptional()
  @IsInt()
  status?: number;

  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  categoryIds?: number[];
}