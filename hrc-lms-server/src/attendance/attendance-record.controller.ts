import {
  Controller,
  Get,
  Post,
  Put,
  Param,
  Body,
  UseGuards,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
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
  // SỬA: Dùng POST, nhận Code từ Body, lấy StudentId từ Token
  // POST /attendance/records/check-in
  @Post('check-in')
  @HttpCode(HttpStatus.OK)
  async checkIn(
    @Body('sessionId', ParseIntPipe) sessionId: number,
    @Body('code') code: string, // <--- Nhận mã QR từ Mobile gửi lên
    @Req() req: any,
  ): Promise<ResponseModel> {
    
    // BẢO MẬT: Lấy ID từ Token của người đang đăng nhập
    const studentId = req.user.id; 

    if (!code) {
        return new ResponseModel({
            status: false,
            statusCode: HttpStatus.BAD_REQUEST,
            message: 'Vui lòng cung cấp mã QR (Attendance Code)',
            data: null,
        });
    }

    const res = await this.recordsService.checkIn(sessionId, studentId, code);

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

  // 3. [MỚI] THỐNG KÊ SĨ SỐ (Dành cho màn hình Giáo viên)
  // GET /attendance/records/statistics/:sessionId
  @Get('statistics/:sessionId')
  @HttpCode(HttpStatus.OK)
  async getStatistics(@Param('sessionId', ParseIntPipe) sessionId: number): Promise<ResponseModel> {
    const stats = await this.recordsService.getSessionStatistics(sessionId);

    return new ResponseModel({
      status: true,
      statusCode: HttpStatus.OK,
      message: 'Statistics retrieved',
      data: stats,
    });
  }

  // 4. XEM LỊCH SỬ ĐIỂM DANH CỦA HỌC SINH TRONG LỚP
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

  @Get('session/:sessionId')
  @HttpCode(HttpStatus.OK)
  async getRecordsBySession(@Param('sessionId', ParseIntPipe) sessionId: number): Promise<ResponseModel> {
    const data = await this.recordsService.findAllBySession(sessionId);

    return new ResponseModel({
      status: true,
      statusCode: HttpStatus.OK,
      message: 'Attendance list retrieved',
      data: data,
    });
  }
}