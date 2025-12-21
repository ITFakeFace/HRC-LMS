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
  Put,
} from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { CreateAttendanceSessionDto } from './dto/create-attendance-session.dto';
import { UpdateAttendanceSessionDto } from './dto/update-attendance-session.dto';
import { ResponseModel } from 'src/response-model/model/response-model.model';
import { AttendanceSessionsService } from './attendance-session.service';

@Controller('attendance/sessions')
@UseGuards(JwtAuthGuard)
export class AttendanceSessionsController {
  constructor(private readonly sessionsService: AttendanceSessionsService) {}

  // 1. CREATE SESSION
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createDto: CreateAttendanceSessionDto): Promise<ResponseModel> {
    const res = await this.sessionsService.create(createDto);

    if (res.hasErrors()) {
      return new ResponseModel({
        status: false,
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'Create Session Failed',
        errors: res.errors,
        data: null,
      });
    }

    return new ResponseModel({
      status: true,
      statusCode: HttpStatus.CREATED,
      message: 'Attendance Session created successfully',
      data: res.session,
    });
  }

  // 2. GET BY CLASS
  @Get('class/:classId')
  @HttpCode(HttpStatus.OK)
  async findAllByClass(@Param('classId', ParseIntPipe) classId: number): Promise<ResponseModel> {
    const data = await this.sessionsService.findAllByClass(classId);

    return new ResponseModel({
      status: true,
      statusCode: HttpStatus.OK,
      message: 'Sessions retrieved successfully',
      data: data,
    });
  }

  // 3. GET ONE
  @Get(':id')
  @HttpCode(HttpStatus.OK)
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<ResponseModel> {
    const res = await this.sessionsService.findOne(id);

    if (res.hasErrors()) {
      return new ResponseModel({
        status: false,
        statusCode: HttpStatus.NOT_FOUND,
        message: `Session ID ${id} not found`,
        errors: res.errors,
        data: null,
      });
    }

    return new ResponseModel({
      status: true,
      statusCode: HttpStatus.OK,
      message: 'Session retrieved successfully',
      data: res.session,
    });
  }

  // 4. UPDATE (CLOSE SESSION)
  @Put(':id')
  @HttpCode(HttpStatus.OK)
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: UpdateAttendanceSessionDto,
  ): Promise<ResponseModel> {
    const res = await this.sessionsService.update(id, updateDto);

    if (res.hasErrors()) {
      if (res.errors.some((err) => err.key === 'id')) {
        return new ResponseModel({
          status: false,
          statusCode: HttpStatus.NOT_FOUND,
          message: `Session ID ${id} not found`,
          errors: res.errors,
          data: null,
        });
      }
      return new ResponseModel({
        status: false,
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'Update Session Failed',
        errors: res.errors,
        data: null,
      });
    }

    return new ResponseModel({
      status: true,
      statusCode: HttpStatus.OK,
      message: 'Session updated successfully',
      data: res.session,
    });
  }
}