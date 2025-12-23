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
import { UpdateClassSessionDto } from './dto/update-class-session.dto';
import { ResponseModel } from 'src/response-model/model/response-model.model';
import { ClassSessionsService } from './class-session.service';

@Controller('sessions')
@UseGuards(JwtAuthGuard)
export class ClassSessionsController {
  constructor(private readonly sessionsService: ClassSessionsService) {}

  // 1. GET BY CLASS
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

  // 2. GET ONE
  @Get(':id')
  @HttpCode(HttpStatus.OK)
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<ResponseModel> {
    const res = await this.sessionsService.findOne(id);
    if (res.hasErrors()) {
      return new ResponseModel({
        status: false,
        statusCode: HttpStatus.NOT_FOUND,
        message: 'Session not found',
        errors: res.errors,
        data: null,
      });
    }
    return new ResponseModel({
      status: true,
      statusCode: HttpStatus.OK,
      message: 'Session details retrieved',
      data: res.session,
    });
  }

  // ========================================================================
  //                          QUẢN LÝ BUỔI HỌC
  // ========================================================================

  // 3. START SESSION (Bắt đầu lớp học - Chưa điểm danh)
  // POST /sessions/:id/start
  @Post(':id/start')
  @HttpCode(HttpStatus.OK)
  async startSession(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: any, // 👈 SỬA: Lấy ID từ Token cho bảo mật
  ): Promise<ResponseModel> {
    const openerId = req.user.id; // Lấy ID giáo viên từ token

    const res = await this.sessionsService.startSession(id, openerId);

    if (res.hasErrors()) {
      // Check lỗi logic cụ thể nếu cần
      return new ResponseModel({
        status: false,
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'Cannot start session',
        errors: res.errors,
        data: null,
      });
    }

    return new ResponseModel({
      status: true,
      statusCode: HttpStatus.OK,
      message: 'Session started successfully',
      data: res.session,
    });
  }

  // 4. OPEN ATTENDANCE (Mới thêm: Mở điểm danh + Sinh QR + Tạo record)
  // POST /sessions/:id/attendance/open
  @Post(':id/attendance/open')
  @HttpCode(HttpStatus.OK)
  async openAttendance(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: any
  ): Promise<ResponseModel> {
    const teacherId = req.user.id;
    
    const res = await this.sessionsService.openAttendance(id, teacherId);

    if (res.hasErrors()) {
      return new ResponseModel({
        status: false,
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'Cannot open attendance',
        errors: res.errors,
        data: null,
      });
    }

    return new ResponseModel({
      status: true,
      statusCode: HttpStatus.OK,
      message: 'Attendance opened. QR Code generated.',
      data: res.session, // Chứa attendanceCode
    });
  }

  // 5. CLOSE ATTENDANCE (Mới thêm: Đóng điểm danh)
  // POST /sessions/:id/attendance/close
  @Post(':id/attendance/close')
  @HttpCode(HttpStatus.OK)
  async closeAttendance(@Param('id', ParseIntPipe) id: number): Promise<ResponseModel> {
    const res = await this.sessionsService.closeAttendance(id);

    if (res.hasErrors()) {
      return new ResponseModel({
        status: false,
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'Cannot close attendance',
        errors: res.errors,
        data: null,
      });
    }

    return new ResponseModel({
      status: true,
      statusCode: HttpStatus.OK,
      message: 'Attendance closed.',
      data: res.session,
    });
  }

  // 6. FINISH SESSION (Kết thúc lớp học)
  // POST /sessions/:id/finish
  @Post(':id/finish')
  @HttpCode(HttpStatus.OK)
  async finishSession(@Param('id', ParseIntPipe) id: number): Promise<ResponseModel> {
    const res = await this.sessionsService.finishSession(id);
    if (res.hasErrors()) {
      return new ResponseModel({
        status: false,
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'Cannot finish session',
        errors: res.errors,
        data: null,
      });
    }
    return new ResponseModel({
      status: true,
      statusCode: HttpStatus.OK,
      message: 'Session finished',
      data: res.session,
    });
  }

  // 7. UPDATE MANUAL
  @Put(':id')
  @HttpCode(HttpStatus.OK)
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateClassSessionDto,
  ): Promise<ResponseModel> {
    const res = await this.sessionsService.update(id, dto);
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
      message: 'Session updated',
      data: res.session,
    });
  }
}