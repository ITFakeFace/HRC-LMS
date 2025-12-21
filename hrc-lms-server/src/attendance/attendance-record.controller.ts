import {
  Controller,
  Get,
  Param,
  Body,
  UseGuards,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
  Put,
} from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { UpdateAttendanceRecordDto } from './dto/update-attendance-record.dto';
import { ResponseModel } from 'src/response-model/model/response-model.model';
import { AttendanceRecordsService } from './attendance-record.service';

@Controller('attendance/records')
@UseGuards(JwtAuthGuard)
export class AttendanceRecordsController {
  constructor(private readonly recordsService: AttendanceRecordsService) {}

  // 1. UPDATE RECORD (CHECK-IN)
  @Put('session/:sessionId/student/:studentId')
  @HttpCode(HttpStatus.OK)
  async update(
    @Param('sessionId', ParseIntPipe) sessionId: number,
    @Param('studentId', ParseIntPipe) studentId: number,
    @Body() updateDto: UpdateAttendanceRecordDto,
  ): Promise<ResponseModel> {
    const res = await this.recordsService.update(sessionId, studentId, updateDto);

    if (res.hasErrors()) {
      // Nếu không tìm thấy record (do sai session hoặc student id) -> 404
      if (res.errors.some((err) => err.key === 'global' && err.value.includes('Không tìm thấy'))) {
         return new ResponseModel({
          status: false,
          statusCode: HttpStatus.NOT_FOUND,
          message: 'Attendance record not found',
          errors: res.errors,
          data: null,
        });
      }

      return new ResponseModel({
        status: false,
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'Attendance update failed',
        errors: res.errors,
        data: null,
      });
    }

    return new ResponseModel({
      status: true,
      statusCode: HttpStatus.OK,
      message: 'Attendance recorded successfully',
      data: res.record,
    });
  }

  // 2. GET BY STUDENT IN CLASS
  @Get('student/:studentId/class/:classId')
  @HttpCode(HttpStatus.OK)
  async findAllByStudent(
    @Param('studentId', ParseIntPipe) studentId: number,
    @Param('classId', ParseIntPipe) classId: number,
  ): Promise<ResponseModel> {
    const data = await this.recordsService.findAllByStudent(studentId, classId);

    return new ResponseModel({
      status: true,
      statusCode: HttpStatus.OK,
      message: 'Attendance records retrieved successfully',
      data: data,
    });
  }
}