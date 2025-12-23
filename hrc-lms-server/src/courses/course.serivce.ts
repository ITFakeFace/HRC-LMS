import { Injectable } from '@nestjs/common';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';
import { CourseDto } from './dto/course.dto';
import { ResponseCourseDto } from './dto/response-course.dto';
import { Prisma } from '@prisma/client';
import { plainToInstance } from 'class-transformer';
import { CoursesRepository } from './course.repository';

// Hàm helper tạo slug
function generateSlug(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[đĐ]/g, 'd')
    .replace(/[^a-z0-9]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

@Injectable()
export class CoursesService {
  constructor(private readonly coursesRepository: CoursesRepository) {}

  // === 1. CREATE ===
  // Thêm tham số imageUrl?: string vào cuối
  async create(createCourseDto: CreateCourseDto, userId: number, imageUrl?: string): Promise<ResponseCourseDto> {
    const res = new ResponseCourseDto();

    // 1. Validate trùng Code
    const existingCode = await this.coursesRepository.findByCode(createCourseDto.code);
    if (existingCode) {
      res.pushError({ key: 'code', value: 'Mã khóa học đã tồn tại.' });
      return res;
    }

    // 2. Xử lý Slug
    const rawSlug = generateSlug(createCourseDto.name);
    const existingSlug = await this.coursesRepository.findBySlug(rawSlug);
    const finalSlug = existingSlug ? `${rawSlug}-${Date.now()}` : rawSlug;

    // 3. Chuẩn bị dữ liệu
    // Lưu ý: coverImage trong DTO ta bỏ qua, ta dùng imageUrl được truyền từ Controller
    const { 
      categoryIds, 
      coverImage: _, // Bỏ qua field này từ DTO
      contents, objectives, audiences, requirements, schedule, locations, instructors, assessment, materials,
      ...restData 
    } = createCourseDto;

    const prismaData: Prisma.CourseCreateInput = {
      ...restData,
      slug: finalSlug,
      creator: { connect: { id: userId } },
      
      // QUAN TRỌNG: Lưu đường dẫn ảnh trực tiếp (String)
      coverImage: imageUrl || null,

      // Xử lý JSON Arrays
      contents: contents as any,
      objectives: objectives as any,
      audiences: audiences as any,
      requirements: requirements as any,
      schedule: schedule as any,
      locations: locations as any,
      instructors: instructors as any,
      
      // Xử lý JSON Objects
      assessment: assessment ? (assessment as any) : Prisma.JsonNull,
      materials: materials ? (materials as any) : Prisma.JsonNull,

      // Xử lý quan hệ N:N với Categories
      categories: categoryIds && categoryIds.length > 0
        ? { connect: categoryIds.map((id) => ({ id })) }
        : undefined,
    };

    try {
      const newCourse = await this.coursesRepository.create(prismaData);
      res.course = plainToInstance(CourseDto, newCourse);
    } catch (error) {
      console.error('Create Course Error:', error);
      res.pushError({ key: 'global', value: 'Lỗi hệ thống khi tạo khóa học.' });
    }

    return res;
  }

  // === 2. FIND ALL ===
  async findAll(): Promise<CourseDto[]> {
    const courses = await this.coursesRepository.findAll();

    // QUAN TRỌNG: Code bây giờ cực gọn, không cần map thủ công Buffer nữa
    // plainToInstance sẽ tự map string -> string
    return plainToInstance(CourseDto, courses);
  }

  // === 3. FIND ONE ===
  async findOne(id: number): Promise<ResponseCourseDto> {
    const res = new ResponseCourseDto();
    const course = await this.coursesRepository.findById(id);

    if (!course) {
      res.pushError({ key: 'id', value: 'Khóa học không tồn tại.' });
      return res;
    }

    res.course = plainToInstance(CourseDto, course);
    return res;
  }

  // === 4. UPDATE ===
  // Thêm tham số imageUrl?: string vào cuối
  async update(id: number, updateCourseDto: UpdateCourseDto, userId: number, imageUrl?: string): Promise<ResponseCourseDto> {
    const res = new ResponseCourseDto();

    // 1. Kiểm tra tồn tại
    const oldCourse = await this.coursesRepository.findById(id);
    if (!oldCourse) {
      res.pushError({ key: 'id', value: 'Khóa học không tồn tại.' });
      return res;
    }

    // 2. Validate Code
    if (updateCourseDto.code && updateCourseDto.code !== oldCourse.code) {
        const checkCode = await this.coursesRepository.findByCode(updateCourseDto.code);
        if (checkCode) {
            res.pushError({ key: 'code', value: 'Mã khóa học mới bị trùng.' });
            return res;
        }
    }

    // 3. Logic Slug
    let newSlug = "";
    if (updateCourseDto.name && updateCourseDto.name !== oldCourse.name) {
       const rawSlug = generateSlug(updateCourseDto.name);
       const existingSlug = await this.coursesRepository.findBySlug(rawSlug);
       if (existingSlug && existingSlug.id !== id) {
         newSlug = `${rawSlug}-${Date.now()}`;
       } else {
         newSlug = rawSlug;
       }
    }

    // 4. Chuẩn bị data update
    // Bỏ qua coverImage từ DTO
    const { categoryIds, coverImage: _, ...restDto } = updateCourseDto;

    const updateData: Prisma.CourseUpdateInput = {
      ...restDto,
      editor: { connect: { id: userId } },
      ...(newSlug && { slug: newSlug }),
      
      // QUAN TRỌNG: Chỉ cập nhật ảnh nếu controller gửi xuống đường dẫn mới
      ...(imageUrl && { coverImage: imageUrl }),
      
      // Ép kiểu JSON
      ...(restDto.contents && { contents: restDto.contents as any }),
      ...(restDto.objectives && { objectives: restDto.objectives as any }),
      ...(restDto.audiences && { audiences: restDto.audiences as any }),
      ...(restDto.requirements && { requirements: restDto.requirements as any }),
      ...(restDto.schedule && { schedule: restDto.schedule as any }),
      ...(restDto.locations && { locations: restDto.locations as any }),
      ...(restDto.instructors && { instructors: restDto.instructors as any }),
      ...(restDto.assessment && { assessment: restDto.assessment as any }),
      ...(restDto.materials && { materials: restDto.materials as any }),

      // Xử lý Categories
      ...(categoryIds && {
        categories: {
          set: categoryIds.map((cid) => ({ id: cid })),
        },
      }),
    };

    try {
      const updatedCourse = await this.coursesRepository.update(id, updateData);
      res.course = plainToInstance(CourseDto, updatedCourse);
    } catch (error) {
      console.error('Update Course Error:', error);
      res.pushError({ key: 'global', value: 'Lỗi khi cập nhật khóa học.' });
    }

    return res;
  }

  // === 5. DELETE ===
  async remove(id: number): Promise<ResponseCourseDto> {
    const res = new ResponseCourseDto();
    
    const course = await this.coursesRepository.findById(id);
    if (!course) {
      res.pushError({ key: 'id', value: 'Khóa học không tồn tại.' });
      return res;
    }

    try {
      await this.coursesRepository.delete(id);
      res.course = plainToInstance(CourseDto, course);
    } catch (error) {
      res.pushError({ key: 'global', value: 'Không thể xóa khóa học này (có thể do ràng buộc dữ liệu).' });
    }

    return res;
  }
}