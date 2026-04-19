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
  Query,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { ErrorReportsService } from './error-reports.service';
import { CreateErrorReportDto } from './dto/create-error-report.dto';
import { UpdateErrorReportDto } from './dto/update-error-report.dto';
import { ResponseModel } from 'src/response-model/model/response-model.model';
import { createMulterOptions } from 'src/image/multer.config';
import { RequestStatus } from '@prisma/client';

@Controller('error-reports')
@UseGuards(JwtAuthGuard)
export class ErrorReportsController {
  constructor(private readonly service: ErrorReportsService) {}

  // 1. CREATE (Báo lỗi kèm ảnh chụp màn hình)
  @Post()
  @HttpCode(HttpStatus.CREATED)
  // Lưu vào folder 'reports'
  @UseInterceptors(FileInterceptor('image', createMulterOptions('reports')))
  async create(
    @Body() dto: CreateErrorReportDto,
    @Req() req: any,
    @UploadedFile() file?: Express.Multer.File,
  ): Promise<ResponseModel> {
    const userId = req.user.id;
    
    if (file) {
      dto.image = `/public/images/reports/${file.filename}`;
    }

    const res = await this.service.create(userId, dto);

    if (res.hasErrors()) {
      return new ResponseModel({
        status: false,
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'Gửi báo lỗi thất bại',
        errors: res.errors,
        data: null,
      });
    }

    return new ResponseModel({
      status: true,
      statusCode: HttpStatus.CREATED,
      message: 'Gửi báo lỗi thành công. Cảm ơn bạn!',
      data: res.errorReport,
    });
  }

  // 2. GET ALL
  @Get()
  @HttpCode(HttpStatus.OK)
  async findAll(
    @Query('status') status?: RequestStatus,
  ): Promise<ResponseModel> {
    const data = await this.service.findAll(status);

    return new ResponseModel({
      status: true,
      statusCode: HttpStatus.OK,
      message: 'Lấy danh sách báo lỗi thành công',
      data: data,
    });
  }

  // 3. GET ONE
  @Get(':id')
  @HttpCode(HttpStatus.OK)
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<ResponseModel> {
    const res = await this.service.findOne(id);

    if (res.hasErrors()) {
      return new ResponseModel({
        status: false,
        statusCode: HttpStatus.NOT_FOUND,
        message: 'Không tìm thấy báo lỗi',
        errors: res.errors,
        data: null,
      });
    }

    return new ResponseModel({
      status: true,
      statusCode: HttpStatus.OK,
      message: 'Lấy chi tiết báo lỗi thành công',
      data: res.errorReport,
    });
  }

  // 4. UPDATE (Admin phản hồi)
  @Put(':id')
  @HttpCode(HttpStatus.OK)
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateErrorReportDto,
  ): Promise<ResponseModel> {
    const res = await this.service.update(id, dto);

    if (res.hasErrors()) {
       if (res.errors.some(e => e.key === 'id')) {
           return new ResponseModel({ status: false, statusCode: 404, message: 'Not Found', errors: res.errors, data: null });
       }
       return new ResponseModel({
        status: false,
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'Cập nhật thất bại',
        errors: res.errors,
        data: null,
      });
    }

    return new ResponseModel({
      status: true,
      statusCode: HttpStatus.OK,
      message: 'Cập nhật trạng thái báo lỗi thành công',
      data: res.errorReport,
    });
  }

  // 5. DELETE
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async remove(@Param('id', ParseIntPipe) id: number): Promise<ResponseModel> {
    const res = await this.service.remove(id);

    if (res.hasErrors()) {
      return new ResponseModel({
        status: false,
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'Xóa thất bại',
        errors: res.errors,
        data: null,
      });
    }

    return new ResponseModel({
      status: true,
      statusCode: HttpStatus.OK,
      message: 'Xóa báo lỗi thành công',
      data: res.errorReport,
    });
  }
}