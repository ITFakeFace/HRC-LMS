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

  // 3. START SESSION (Giáo viên bấm Start)
  // POST /sessions/:id/start
  @Post(':id/start')
  @HttpCode(HttpStatus.OK)
  async startSession(
    @Param('id', ParseIntPipe) id: number,
    @Body('openerId', ParseIntPipe) openerId: number // <--- ĐỔI TẠI ĐÂY
  ): Promise<ResponseModel> {
    
    const res = await this.sessionsService.startSession(id, openerId);

    if (res.hasErrors()) {
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

  // 4. FINISH SESSION
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

  // 5. UPDATE MANUAL
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