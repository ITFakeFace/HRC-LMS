// course.dto.ts
import { Expose, Type } from 'class-transformer';
import { CategoryDto } from 'src/categories/dto/category.dto';
import { ContentItemDto, AssessmentDto, MaterialsDto } from './json-fields.dto';

export class CourseDto {
  @Expose()
  id: number;

  @Expose()
  code: string;

  @Expose()
  name: string;

  @Expose()
  slug: string;

  @Expose()
  description: string | null;

  @Expose()
  duration: string | null;

  @Expose()
  status: number;

  // --- JSON FIELDS ---
  @Expose()
  objectives: string[];

  @Expose()
  audiences: string[] | null;

  @Expose()
  requirements: string[] | null;

  @Expose()
  schedule: string[] | null;

  @Expose()
  locations: string[] | null;

  @Expose()
  instructors: string[] | null;

  @Expose()
  assessment: AssessmentDto | null;

  @Expose()
  materials: MaterialsDto | null;

  @Expose()
  contents: ContentItemDto[] | null;

  // --- IMAGE & DATES (PHẦN QUAN TRỌNG ĐÃ SỬA) ---
  
  @Expose({ name: 'cover_image' }) // Ánh xạ cột 'cover_image' trong DB sang biến này
  // Không cần @Transform convert Buffer nữa vì DB trả về string đường dẫn rồi
  coverImage: string | null; 

  @Expose()
  createdAt: Date;

  @Expose()
  updatedAt: Date;

  // --- RELATION ---
  @Expose()
  @Type(() => CategoryDto)
  categories?: CategoryDto[];
}