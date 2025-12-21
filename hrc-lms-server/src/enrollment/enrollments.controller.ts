import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  UseGuards,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
  Put,
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
  async create(@Body() createEnrollmentDto: CreateEnrollmentDto): Promise<ResponseModel> {
    const res = await this.enrollmentsService.create(createEnrollmentDto);

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
      message: 'Student enrolled successfully',
      data: res.enrollment,
    });
  }

  // 2. GET BY STUDENT
  @Get('student/:studentId')
  @HttpCode(HttpStatus.OK)
  async findAllByStudent(@Param('studentId', ParseIntPipe) studentId: number): Promise<ResponseModel> {
    const data = await this.enrollmentsService.findAllByStudent(studentId);

    return new ResponseModel({
      status: true,
      statusCode: HttpStatus.OK,
      message: 'Enrollments retrieved successfully',
      data: data,
    });
  }

  // 3. UPDATE
  @Put(':id')
  @HttpCode(HttpStatus.OK)
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateEnrollmentDto: UpdateEnrollmentDto,
  ): Promise<ResponseModel> {
    const res = await this.enrollmentsService.update(id, updateEnrollmentDto);

    if (res.hasErrors()) {
      if (res.errors.some((err) => err.key === 'id')) {
        return new ResponseModel({
          status: false,
          statusCode: HttpStatus.NOT_FOUND,
          message: `Enrollment ID ${id} not found.`,
          errors: res.errors,
          data: null,
        });
      }
      return new ResponseModel({
        status: false,
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'Update Enrollment Failed',
        errors: res.errors,
        data: null,
      });
    }

    return new ResponseModel({
      status: true,
      statusCode: HttpStatus.OK,
      message: `Enrollment ID ${id} updated successfully`,
      data: res.enrollment,
    });
  }

  // 4. DELETE
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async remove(@Param('id', ParseIntPipe) id: number): Promise<ResponseModel> {
    const res = await this.enrollmentsService.remove(id);

    if (res.hasErrors()) {
      return new ResponseModel({
        status: false,
        statusCode: HttpStatus.BAD_REQUEST, // Hoặc 404 tùy logic service
        message: 'Cannot delete enrollment',
        errors: res.errors,
        data: null,
      });
    }

    return new ResponseModel({
      status: true,
      statusCode: HttpStatus.OK,
      message: `Enrollment ID ${id} deleted successfully`,
      data: res.enrollment,
    });
  }
}