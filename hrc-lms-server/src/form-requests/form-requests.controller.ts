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
import { FormRequestsService } from './form-requests.service';
import { CreateFormRequestDto } from './dto/create-form-request.dto';
import { UpdateFormRequestDto } from './dto/update-form-request.dto';
import { ResponseModel } from 'src/response-model/model/response-model.model';
import { createMulterOptions } from 'src/image/multer.config';
import { RequestStatus } from '@prisma/client';

@Controller('form-requests')
@UseGuards(JwtAuthGuard)
export class FormRequestsController {
  constructor(private readonly service: FormRequestsService) {}

  // 1. CREATE (Gửi yêu cầu kèm ảnh minh chứng)
  @Post()
  @HttpCode(HttpStatus.CREATED)
  // Lưu ảnh vào thư mục 'forms' (Bạn nhớ tạo folder này hoặc chỉnh lại config multer)
  @UseInterceptors(FileInterceptor('image', createMulterOptions('forms'))) 
  async create(
    @Body() dto: CreateFormRequestDto,
    @Req() req: any,
    @UploadedFile() file?: Express.Multer.File,
  ): Promise<ResponseModel> {
    const userId = req.user.id;
    
    // Xử lý ảnh
    if (file) {
      dto.image = `/public/images/forms/${file.filename}`;
    }

    const res = await this.service.create(userId, dto);

    if (res.hasErrors()) {
      return new ResponseModel({
        status: false,
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'Gửi yêu cầu thất bại',
        errors: res.errors,
        data: null,
      });
    }

    return new ResponseModel({
      status: true,
      statusCode: HttpStatus.CREATED,
      message: 'Gửi yêu cầu thành công',
      data: res.formRequest,
    });
  }

  // 2. GET ALL (Có lọc theo status hoặc userId)
  @Get()
  @HttpCode(HttpStatus.OK)
  async findAll(
    @Query('userId') userId?: string, // Admin có thể lọc theo user cụ thể
    @Query('status') status?: RequestStatus, // Lọc theo trạng thái (PENDING...)
  ): Promise<ResponseModel> {
    const uid = userId ? parseInt(userId) : undefined;
    
    // Gọi service (lưu ý: service trả về mảng DTO thuần, không bọc ResponseDto, tùy cách bạn handle)
    // Nếu service trả về mảng trực tiếp:
    const data = await this.service.findAll(uid, status);

    return new ResponseModel({
      status: true,
      statusCode: HttpStatus.OK,
      message: 'Lấy danh sách yêu cầu thành công',
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
        message: 'Không tìm thấy yêu cầu',
        errors: res.errors,
        data: null,
      });
    }

    return new ResponseModel({
      status: true,
      statusCode: HttpStatus.OK,
      message: 'Lấy chi tiết yêu cầu thành công',
      data: res.formRequest,
    });
  }

  // 4. UPDATE (Admin duyệt hoặc User sửa)
  @Put(':id')
  @HttpCode(HttpStatus.OK)
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateFormRequestDto,
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
      message: 'Cập nhật yêu cầu thành công',
      data: res.formRequest,
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
        statusCode: HttpStatus.BAD_REQUEST, // Hoặc 404
        message: 'Xóa thất bại',
        errors: res.errors,
        data: null,
      });
    }

    return new ResponseModel({
      status: true,
      statusCode: HttpStatus.OK,
      message: 'Xóa yêu cầu thành công',
      data: res.formRequest,
    });
  }
}