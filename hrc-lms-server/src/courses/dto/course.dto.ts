import { Expose, Transform, Type } from 'class-transformer';
import { CategoryDto } from 'src/categories/dto/category.dto';
import { ContentItemDto, AssessmentDto, MaterialsDto } from './json-fields.dto';

export class CourseDto {
  
  id: number;

  
  code: string;

  
  name: string;

  
  slug: string;

  
  description: string | null;

  
  duration: string | null;

  
  status: number;

  // --- JSON FIELDS (Tự động map JSON DB -> Object JS) ---
  
  objectives: string[];

  
  audiences: string[] | null;

  
  requirements: string[] | null;

  
  schedule: string[] | null;

  
  locations: string[] | null;

  
  instructors: string[] | null;

  assessment: AssessmentDto | null;

  materials: MaterialsDto | null;

  contents: ContentItemDto[] | null;

  // --- IMAGE & DATES ---
  
  
  @Transform(({ value }) => (value ? Buffer.from(value).toString('base64') : null))
  coverImage: string | null;

  
  createdAt: Date;

  
  updatedAt: Date;

  // --- RELATION ---
  
  @Type(() => CategoryDto)
  categories?: CategoryDto[];
}