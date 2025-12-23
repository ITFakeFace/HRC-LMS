import { Injectable } from '@nestjs/common';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';
import { CourseDto } from './dto/course.dto';
import { ResponseCourseDto } from './dto/response-course.dto';
import { Prisma } from '@prisma/client';
import { plainToInstance } from 'class-transformer';
import { CoursesRepository } from './course.repository';
import { PrismaService } from 'src/prisma/prisma.service'; // 1. IMPORT PRISMA SERVICE

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
  // 2. INJECT PRISMA SERVICE VÀO CONSTRUCTOR
  constructor(
    private readonly coursesRepository: CoursesRepository,
    private readonly prisma: PrismaService 
  ) {}

  // === 1. CREATE ===
  async create(createCourseDto: CreateCourseDto, userId: number, imageUrl?: string): Promise<ResponseCourseDto> {
    const res = new ResponseCourseDto();

    const existingCode = await this.coursesRepository.findByCode(createCourseDto.code);
    if (existingCode) {
      res.pushError({ key: 'code', value: 'Mã khóa học đã tồn tại.' });
      return res;
    }

    const rawSlug = generateSlug(createCourseDto.name);
    const existingSlug = await this.coursesRepository.findBySlug(rawSlug);
    const finalSlug = existingSlug ? `${rawSlug}-${Date.now()}` : rawSlug;

    const { 
      categoryIds, 
      coverImage: _, 
      contents, objectives, audiences, requirements, schedule, locations, instructors, assessment, materials,
      ...restData 
    } = createCourseDto;

    const prismaData: Prisma.CourseCreateInput = {
      ...restData,
      slug: finalSlug,
      creator: { connect: { id: userId } },
      coverImage: imageUrl || null,
      contents: contents as any,
      objectives: objectives as any,
      audiences: audiences as any,
      requirements: requirements as any,
      schedule: schedule as any,
      locations: locations as any,
      instructors: instructors as any,
      assessment: assessment ? (assessment as any) : Prisma.JsonNull,
      materials: materials ? (materials as any) : Prisma.JsonNull,
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
  async update(id: number, updateCourseDto: UpdateCourseDto, userId: number, imageUrl?: string): Promise<ResponseCourseDto> {
    const res = new ResponseCourseDto();

    const oldCourse = await this.coursesRepository.findById(id);
    if (!oldCourse) {
      res.pushError({ key: 'id', value: 'Khóa học không tồn tại.' });
      return res;
    }

    if (updateCourseDto.code && updateCourseDto.code !== oldCourse.code) {
        const checkCode = await this.coursesRepository.findByCode(updateCourseDto.code);
        if (checkCode) {
            res.pushError({ key: 'code', value: 'Mã khóa học mới bị trùng.' });
            return res;
        }
    }

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

    const { categoryIds, coverImage: _, ...restDto } = updateCourseDto;

    const updateData: Prisma.CourseUpdateInput = {
      ...restDto,
      editor: { connect: { id: userId } },
      ...(newSlug && { slug: newSlug }),
      ...(imageUrl && { coverImage: imageUrl }),
      ...(restDto.contents && { contents: restDto.contents as any }),
      ...(restDto.objectives && { objectives: restDto.objectives as any }),
      ...(restDto.audiences && { audiences: restDto.audiences as any }),
      ...(restDto.requirements && { requirements: restDto.requirements as any }),
      ...(restDto.schedule && { schedule: restDto.schedule as any }),
      ...(restDto.locations && { locations: restDto.locations as any }),
      ...(restDto.instructors && { instructors: restDto.instructors as any }),
      ...(restDto.assessment && { assessment: restDto.assessment as any }),
      ...(restDto.materials && { materials: restDto.materials as any }),
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

  // === 6. GET TEACHER SCHEDULE (MỚI THÊM) ===
  /**
   * Lấy lịch dạy của giảng viên
   * Giả sử bạn có bảng 'Session' hoặc 'Lesson' liên kết với 'Course'
   * Và Course có trường 'instructorId' hoặc 'teacherId'
   */
  async getTeacherSchedule(teacherId: number, fromDate: string, toDate: string) {
    
    // 1. Query bảng ClassSession
    const sessions = await this.prisma.classSession.findMany({
      where: {
        // Điều kiện: Ngày nằm trong khoảng from-to
        date: {
          gte: new Date(fromDate),
          lte: new Date(toDate),
        },
        // Điều kiện quan trọng: Lớp này phải do teacherId dạy
        class: {
          lecturerId: teacherId, 
          // (Nếu muốn kỹ hơn: Lớp phải đang ACTIVE hoặc UPCOMING, không lấy CANCELED)
          status: {
            not: 'CANCELED' 
          }
        },
      },
      include: {
        // Include để lấy tên Lớp và tên Khóa học
        class: {
          include: {
            course: true, 
          }
        }
      },
      orderBy: {
        date: 'asc', // Sắp xếp ngày tăng dần
      },
    });

    // 2. Map dữ liệu sang format Client cần (giống HomeScreen.js)
    return sessions.map((session) => {
      // Format giờ: lấy từ DateTime session.startTime
      // Lưu ý: startTime trong DB của bạn là DateTime, nên cần format ra HH:mm
      const start = new Date(session.startTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
      const end = new Date(session.endTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });

      // Lấy địa điểm (Schema của bạn lưu location trong Course dạng JSON, 
      // hoặc nếu chưa có chỗ lưu phòng cụ thể thì hardcode tạm)
      // Tạm thời lấy location đầu tiên trong mảng Course.locations hoặc mặc định
      let location = "Phòng Lab (Tầng 3)"; 
      if (session.class.course.locations && Array.isArray(session.class.course.locations)) {
          location = session.class.course.locations[0] as string;
      }

      return {
        id: session.id,
        // Tên hiển thị: Có thể là tên Lớp (React Native K18) hoặc tên Khóa học
        className: session.class.name, 
        courseName: session.class.course.name,
        
        date: session.date,
        startTime: session.startTime,
        endTime: session.endTime,
        
        // Format chuỗi giờ để hiển thị ngay (nếu FE lười format)
        timeString: `${start} - ${end}`,
        
        address: location,
        
        // Trạng thái buổi học (SCHEDULED, ONGOING, FINISHED)
        sessionStatus: session.status,
        
        // Flag để Frontend biết buổi này đã mở điểm danh chưa
        isAttendanceOpen: session.isAttendanceOpen
      };
    });
  }
}