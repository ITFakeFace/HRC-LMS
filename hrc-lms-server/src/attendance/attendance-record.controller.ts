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
  Req,
} from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { UpdateAttendanceRecordDto } from './dto/update-attendance-record.dto';
import { ResponseModel } from 'src/response-model/model/response-model.model';
import { AttendanceRecordsService } from './attendance-record.service';

@Controller('attendance/records')
@UseGuards(JwtAuthGuard)
export class AttendanceRecordsController {
  constructor(private readonly recordsService: AttendanceRecordsService) {}

  // 1. SINH VIÊN QUÉT QR (CHECK-IN)
  // PUT /attendance/records/check-in/session/:sessionId
  @Put('check-in/session/:sessionId/student/:studentId')
  @HttpCode(HttpStatus.OK)
  async checkIn(
    @Param('sessionId', ParseIntPipe) sessionId: number,
    @Param('studentId', ParseIntPipe) studentId: number, // <--- LẤY TỪ PARAM
  ): Promise<ResponseModel> {
    
    // Lưu ý: Logic check xem user đang login có phải là studentId này không 
    // nên được xử lý ở Guard hoặc Service nếu cần bảo mật chặt chẽ.

    const res = await this.recordsService.checkIn(sessionId, studentId);

    if (res.hasErrors()) {
      return new ResponseModel({
        status: false,
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'Check-in Failed',
        errors: res.errors,
        data: null,
      });
    }

    return new ResponseModel({
      status: true,
      statusCode: HttpStatus.OK,
      message: 'Check-in Successful',
      data: res.record,
    });
  }

  // 2. GIÁO VIÊN SỬA THỦ CÔNG
  @Put('manual/session/:sessionId/student/:studentId')
  @HttpCode(HttpStatus.OK)
  async updateManual(
    @Param('sessionId', ParseIntPipe) sessionId: number,
    @Param('studentId', ParseIntPipe) studentId: number,
    @Body() dto: UpdateAttendanceRecordDto,
  ): Promise<ResponseModel> {
    const res = await this.recordsService.updateManual(sessionId, studentId, dto);

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
      message: 'Record updated manually',
      data: res.record,
    });
  }

  // 3. XEM LỊCH SỬ ĐIỂM DANH CỦA HỌC SINH TRONG LỚP
  @Get('student/:studentId/class/:classId')
  @HttpCode(HttpStatus.OK)
  async getHistory(
    @Param('studentId', ParseIntPipe) studentId: number,
    @Param('classId', ParseIntPipe) classId: number,
  ): Promise<ResponseModel> {
    const data = await this.recordsService.findByStudentInClass(studentId, classId);

    return new ResponseModel({
      status: true,
      statusCode: HttpStatus.OK,
      message: 'History retrieved',
      data: data,
    });
  }
}