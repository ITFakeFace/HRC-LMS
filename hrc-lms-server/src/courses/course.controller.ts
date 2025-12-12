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
} from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';
import { ResponseModel } from 'src/response-model/model/response-model.model';
import { CoursesService } from './course.serivce';

@Controller('courses')
@UseGuards(JwtAuthGuard)
export class CoursesController {
  constructor(private readonly coursesService: CoursesService) {}

  // 1. CREATE (POST /courses)
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body() createCourseDto: CreateCourseDto,
    @Req() req: any,
  ): Promise<ResponseModel> {
    // Lấy ID user từ token (do JwtAuthGuard gán vào req.user)
    const userId = req.user.id;

    const res = await this.coursesService.create(createCourseDto, userId);

    if (res.hasErrors()) {
      return new ResponseModel({
        status: false,
        statusCode: HttpStatus.BAD_REQUEST, // 400
        message: 'Validation failed or creation error',
        errors: res.errors,
        data: null,
      });
    }

    return new ResponseModel({
      status: true,
      statusCode: HttpStatus.CREATED, // 201
      message: 'Course created successfully',
      data: res.course,
    });
  }

  // 2. READ ALL (GET /courses)
  @Get()
  @HttpCode(HttpStatus.OK)
  async findAll(): Promise<ResponseModel> {
    // findAll của Service trả về mảng CourseDto[] trực tiếp
    const res = await this.coursesService.findAll();

    return new ResponseModel({
      status: true,
      statusCode: HttpStatus.OK, // 200
      message: 'Courses retrieved successfully',
      data: res,
    });
  }

  // 3. READ ONE (GET /courses/:id)
  @Get(':id')
  @HttpCode(HttpStatus.OK)
  async findById(@Param('id', ParseIntPipe) id: number): Promise<ResponseModel> {
    const res = await this.coursesService.findOne(id);

    if (res.hasErrors()) {
      // Ưu tiên check lỗi 404 (ID không tồn tại)
      if (res.errors.some((err) => err.key === 'id')) {
        return new ResponseModel({
          status: false,
          statusCode: HttpStatus.NOT_FOUND, // 404
          message: `Course with ID ${id} not found.`,
          errors: res.errors,
          data: null,
        });
      }

      // Các lỗi khác
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
      statusCode: HttpStatus.OK, // 200
      message: `Course ID ${id} retrieved successfully`,
      data: res.course,
    });
  }

  // 4. UPDATE (PUT /courses/:id)
  @Put(':id')
  @HttpCode(HttpStatus.OK)
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateCourseDto: UpdateCourseDto,
    @Req() req: any,
  ): Promise<ResponseModel> {
    // Lấy ID user để lưu vào lastEditor
    const userId = req.user.id;

    const res = await this.coursesService.update(id, updateCourseDto, userId);

    if (res.hasErrors()) {
      // Check lỗi 404
      if (res.errors.some((err) => err.key === 'id')) {
        return new ResponseModel({
          status: false,
          statusCode: HttpStatus.NOT_FOUND,
          message: `Course with ID ${id} not found.`,
          errors: res.errors,
          data: null,
        });
      }

      // Lỗi validation khác (ví dụ trùng code, trùng slug)
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
      statusCode: HttpStatus.OK, // 200
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
      // Lỗi 404
      if (res.errors.some((err) => err.key === 'id')) {
        return new ResponseModel({
          status: false,
          statusCode: HttpStatus.NOT_FOUND,
          message: `Course with ID ${id} not found.`,
          errors: res.errors,
          data: null,
        });
      }

      // Lỗi khác (Ràng buộc dữ liệu)
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
      statusCode: HttpStatus.OK, // 200
      message: `Course ID ${id} deleted successfully`,
      data: res.course,
    });
  }
}