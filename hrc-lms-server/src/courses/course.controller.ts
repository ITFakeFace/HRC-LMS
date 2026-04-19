import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Put,
  UseGuards,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
  Req,
  UseInterceptors, // MỚI
  UploadedFile,
  Query, // MỚI
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express'; // MỚI
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';
import { ResponseModel } from 'src/response-model/model/response-model.model';
import { CoursesService } from './course.serivce'; // Check lại chính tả: course.service
import { createMulterOptions } from 'src/image/multer.config'; // Import config Multer

@Controller('courses')
@UseGuards(JwtAuthGuard)
export class CoursesController {
  constructor(private readonly coursesService: CoursesService) {}

  // 1. CREATE (POST /courses)
  // Phải dùng Interceptor để đọc form-data (kể cả khi không up ảnh thì DTO vẫn nằm trong form-data)
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(
    FileInterceptor('coverImage', createMulterOptions('courses')),
  ) // Key là 'coverImage', lưu vào folder 'courses'
  async create(
    @Body() createCourseDto: CreateCourseDto,
    @Req() req: any,
    @UploadedFile() file?: Express.Multer.File, // File có thể null
  ): Promise<ResponseModel> {
    const userId = req.user.id;

    // --- XỬ LÝ ẢNH ---
    let imageUrl = '';
    if (file) {
      // Tạo đường dẫn tĩnh để lưu vào DB
      imageUrl = `/public/images/courses/${file.filename}`;
    }

    // Truyền imageUrl vào Service (Service đã sửa ở bước trước để nhận tham số thứ 3)
    const res = await this.coursesService.create(
      createCourseDto,
      userId,
      imageUrl,
    );

    if (res.hasErrors()) {
      return new ResponseModel({
        status: false,
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'Validation failed or creation error',
        errors: res.errors,
        data: null,
      });
    }

    return new ResponseModel({
      status: true,
      statusCode: HttpStatus.CREATED,
      message: 'Course created successfully',
      data: res.course,
    });
  }

  // 2. READ ALL (GET /courses)
  @Get()
  @HttpCode(HttpStatus.OK)
  async findAll(): Promise<ResponseModel> {
    const res = await this.coursesService.findAll();
    return new ResponseModel({
      status: true,
      statusCode: HttpStatus.OK,
      message: 'Courses retrieved successfully',
      data: res,
    });
  }

  // Phải đặt TRƯỚC @Get(':id') để tránh xung đột đường dẫn
  @Get('teacher-schedule')
  @HttpCode(HttpStatus.OK)
  async getTeacherSchedule(
    @Query('teacherId', ParseIntPipe) teacherId: number,
    @Query('fromDate') fromDate: string,
    @Query('toDate') toDate: string,
  ): Promise<ResponseModel> {
    // Gọi service đã viết ở bước trước
    const data = await this.coursesService.getTeacherSchedule(
      teacherId,
      fromDate,
      toDate,
    );

    return new ResponseModel({
      status: true,
      statusCode: HttpStatus.OK,
      message: 'Teacher schedule retrieved successfully',
      data: data,
    });
  }

  // 3. READ ONE (GET /courses/:id)
  @Get(':id')
  @HttpCode(HttpStatus.OK)
  async findById(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<ResponseModel> {
    const res = await this.coursesService.findOne(id);

    if (res.hasErrors()) {
      if (res.errors.some((err) => err.key === 'id')) {
        return new ResponseModel({
          status: false,
          statusCode: HttpStatus.NOT_FOUND,
          message: `Course with ID ${id} not found.`,
          errors: res.errors,
          data: null,
        });
      }

      return new ResponseModel({
        status: false,
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'Error retrieving course data.',
        errors: res.errors,
        data: null,
      });
    }

    return new ResponseModel({
      status: true,
      statusCode: HttpStatus.OK,
      message: `Course ID ${id} retrieved successfully`,
      data: res.course,
    });
  }

  // --- 🔴 3. GET TEACHER SCHEDULE (MỚI THÊM) ---

  // 4. UPDATE (PUT /courses/:id)
  @Put(':id')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(
    FileInterceptor('coverImage', createMulterOptions('courses')),
  )
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateCourseDto: UpdateCourseDto,
    @Req() req: any,
    @UploadedFile() file?: Express.Multer.File,
  ): Promise<ResponseModel> {
    const userId = req.user.id;

    // --- 🔴 DEBUG LOG (Thêm vào đây) ---
    console.log('--- DEBUG UPDATE COURSE ---');
    console.log('1. ID:', id);
    console.log('2. Body Keys:', Object.keys(updateCourseDto)); // Xem có nhận được text không
    console.log('3. File Object:', file); // QUAN TRỌNG: Nếu cái này là undefined -> Lỗi Frontend
    // ------------------------------------

    let imageUrl: string | null | undefined = undefined;

    // Nếu file tồn tại thì mới tạo đường dẫn
    if (file) {
      console.log('-> File detected! Filename:', file.filename);
      imageUrl = `/public/images/courses/${file.filename}`;
    } else {
      console.log('-> No file detected in request.');
    }

    const res = await this.coursesService.update(
      id,
      updateCourseDto,
      userId,
      imageUrl,
    );

    if (res.hasErrors()) {
      if (res.errors.some((err) => err.key === 'id')) {
        return new ResponseModel({
          status: false,
          statusCode: HttpStatus.NOT_FOUND,
          message: `Course with ID ${id} not found.`,
          errors: res.errors,
          data: null,
        });
      }

      return new ResponseModel({
        status: false,
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'Validation failed or update error',
        errors: res.errors,
        data: null,
      });
    }

    return new ResponseModel({
      status: true,
      statusCode: HttpStatus.OK,
      message: `Course ID ${id} updated successfully`,
      data: res.course,
    });
  }

  // 5. DELETE (DELETE /courses/:id)
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async remove(@Param('id', ParseIntPipe) id: number): Promise<ResponseModel> {
    const res = await this.coursesService.remove(id);

    if (res.hasErrors()) {
      if (res.errors.some((err) => err.key === 'id')) {
        return new ResponseModel({
          status: false,
          statusCode: HttpStatus.NOT_FOUND,
          message: `Course with ID ${id} not found.`,
          errors: res.errors,
          data: null,
        });
      }

      return new ResponseModel({
        status: false,
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'Cannot delete course (data constraint).',
        errors: res.errors,
        data: null,
      });
    }

    return new ResponseModel({
      status: true,
      statusCode: HttpStatus.OK,
      message: `Course ID ${id} deleted successfully`,
      data: res.course,
    });
  }
}
