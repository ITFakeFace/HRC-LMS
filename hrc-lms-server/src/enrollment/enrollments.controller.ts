import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
  Query,
  Put,
  Req,
  BadRequestException,
} from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { CreateEnrollmentDto } from './dto/create-enrollment.dto';
import { UpdateEnrollmentDto } from './dto/update-enrollment.dto';
import { ResponseModel } from 'src/response-model/model/response-model.model';
import { EnrollmentsService } from './enrollment.service';

@Controller('enrollments')
@UseGuards(JwtAuthGuard)
export class EnrollmentsController {
  constructor(private readonly enrollmentsService: EnrollmentsService) {}

  // 1. CREATE
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createDto: CreateEnrollmentDto): Promise<ResponseModel> {
    const res = await this.enrollmentsService.create(createDto);
    if (res.hasErrors()) {
      return new ResponseModel({
        status: false,
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'Enrollment Failed',
        errors: res.errors,
        data: null,
      });
    }
    return new ResponseModel({
      status: true,
      statusCode: HttpStatus.CREATED,
      message: 'Enrolled successfully',
      data: res.enrollment,
    });
  }

  // 2. QUERY: LỊCH HỌC CỦA TÔI (Quan trọng)
  // GET /enrollments/my-schedule?fromDate=2023-10-01&toDate=2023-10-31
  @Get('schedule') // Đổi tên route từ my-schedule -> schedule cho đúng ngữ nghĩa
  @HttpCode(HttpStatus.OK)
  async getSchedule(
    @Query('studentId', ParseIntPipe) studentId: number, // <--- LẤY TỪ QUERY
    @Query('fromDate') fromDate: string,
    @Query('toDate') toDate: string,
  ): Promise<ResponseModel> {

    if (!fromDate || !toDate) {
      throw new BadRequestException('fromDate and toDate are required');
    }

    const data = await this.enrollmentsService.getMySchedule(studentId, fromDate, toDate);

    return new ResponseModel({
      status: true,
      statusCode: HttpStatus.OK,
      message: 'Schedule retrieved successfully',
      data: data,
    });
  }

  // 3. UPDATE
  @Put(':id')
  @HttpCode(HttpStatus.OK)
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateEnrollmentDto,
  ): Promise<ResponseModel> {
    const res = await this.enrollmentsService.update(id, dto);
    if (res.hasErrors()) {
      return new ResponseModel({
        status: false,
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'Update Failed',
        errors: res.errors,
        data: null,
      });
    }
    return new ResponseModel({
      status: true,
      statusCode: HttpStatus.OK,
      message: 'Enrollment updated',
      data: res.enrollment,
    });
  }
}