// src/users/users.controller.ts

import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
  UseInterceptors,
  UploadedFile,
  // Thêm các Exception cần thiết nếu service ném ra (ví dụ: NotFoundException)
  NotFoundException,
  Put,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ResponseModel } from 'src/response-model/model/response-model.model';
import { FileInterceptor } from '@nestjs/platform-express';

import { createMulterOptions } from 'src/image/multer.config'; // Import config Multer

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) { }

  // 1. CREATE (POST /users)
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createUserDto: CreateUserDto): Promise<ResponseModel> {
    const res = await this.usersService.create(createUserDto);

    // Kiểm tra nếu service trả về lỗi (từ ResponseUserDto)
    if (res.errors && res.errors.length > 0) {
      return new ResponseModel({
        status: false,
        statusCode: HttpStatus.BAD_REQUEST, // 400 Bad Request cho lỗi validation
        message: 'Validation Failed or User Creation Error',
        errors: res.errors,
        data: null,
      });
    }

    // Thành công
    return new ResponseModel({
      status: true,
      statusCode: HttpStatus.CREATED, // 201
      message: 'User created successfully',
      data: res.user,
    });
  }

  // 2. READ ALL (GET /users)
  @Get()
  @HttpCode(HttpStatus.OK)
  async findAll(): Promise<ResponseModel> {
    const res = (await this.usersService.findAll()).map(({ password, ...rest }) => rest);
    return new ResponseModel({
      status: true,
      statusCode: HttpStatus.OK, // 200
      message: 'Users retrieved successfully',
      data: res, // res là mảng User[]
    });
  }

  // 3. READ ONE (GET /users/:id)
  @Get(':id')
  @HttpCode(HttpStatus.OK)
  async findById(@Param('id', ParseIntPipe) id: number): Promise<ResponseModel> {
    // ⚠️ Giả định usersService.findOne(id) sẽ ném ra NotFoundException nếu không tìm thấy.
    // Nếu service không ném exception mà trả về null/ResponseUserDto, logic cần được điều chỉnh.
    const res = await this.usersService.findById(id);

    if (res.errors && res.errors.length > 0) {
      // Chúng ta giả định lỗi đầu tiên là lỗi chính, thường là lỗi 404 cho trường 'id'
      if (res.errors.some((err) => err.key === 'id')) {
        return new ResponseModel({
          status: false,
          statusCode: HttpStatus.NOT_FOUND, // 404 Not Found
          message: `User with ID ${id} not found.`,
          errors: res.errors,
          data: null,
        });
      }

      // Nếu là lỗi khác (ví dụ: lỗi global không mong muốn), trả về 400
      return new ResponseModel({
        status: false,
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'Error retrieving user data.',
        errors: res.errors,
        data: null,
      });
    }

    return new ResponseModel({
      status: true,
      statusCode: HttpStatus.OK, // 200
      message: `User ID ${id} retrieved successfully`,
      data: res.user,
    });
  }

  // 4. UPDATE (PATCH /users/:id)

  @Put(':id')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(FileInterceptor('file', createMulterOptions('users')))
  async update(
    @Param('id', ParseIntPipe) id: number,
    @UploadedFile() file: Express.Multer.File,
    @Body() updateUserDto: UpdateUserDto,
  ): Promise<ResponseModel> {

    // ✅ 1) Nếu có upload ảnh -> gán đường dẫn vào avatar
    // Bạn đang serve ảnh qua: GET /upload/images/:folder/:filename
    // => lưu dạng path tương đối để FE ghép baseURL
    if (file?.filename) {
      updateUserDto.avatar = `/public/images/users/${file.filename}`;
    }

    // ✅ 2) Vì multipart gửi lên toàn string, normalize vài field hay gặp:
    // gender có thể là "true"/"false"/"" -> boolean/null
    if (typeof (updateUserDto as any).gender === 'string') {
      const g = (updateUserDto as any).gender;
      if (g === '') delete (updateUserDto as any).gender;
      else updateUserDto.gender = g === 'true';
    }

    // roles có thể bị gửi lên thành string JSON hoặc string đơn
    // Ví dụ FE gửi roles = "[1,2]" hoặc roles[] = "1","2"
    const rolesAny = (updateUserDto as any).roles;
    if (typeof rolesAny === 'string') {
      try {
        const parsed = JSON.parse(rolesAny);
        (updateUserDto as any).roles = Array.isArray(parsed)
          ? parsed.map((x) => Number(x))
          : null;
      } catch {
        // nếu chỉ là "1"
        (updateUserDto as any).roles = rolesAny ? [Number(rolesAny)] : null;
      }
    } else if (Array.isArray(rolesAny)) {
      (updateUserDto as any).roles = rolesAny.map((x) => Number(x));
    }

    const res = await this.usersService.update(id, updateUserDto);

    if (res.errors && res.errors.length > 0) {
      if (res.errors.some((err) => err.key === 'id')) {
        return new ResponseModel({
          status: false,
          statusCode: HttpStatus.NOT_FOUND,
          message: 'User not found or Role ID missing',
          errors: res.errors,
          data: null,
        });
      }
      return new ResponseModel({
        status: false,
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'Validation Failed or Update Error',
        errors: res.errors,
        data: null,
      });
    }

    return new ResponseModel({
      status: true,
      statusCode: HttpStatus.OK,
      message: `User ID ${id} updated successfully`,
      data: res.user,
    });
  }

  // 5. DELETE (DELETE /users/:id)
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async remove(@Param('id', ParseIntPipe) id: number): Promise<ResponseModel> {
    const res = await this.usersService.delete(id);

    // Kiểm tra nếu service trả về lỗi (từ ResponseUserDto)
    if (res.errors && res.errors.length > 0) {
      // Lỗi không tìm thấy (lỗi 404)
      return new ResponseModel({
        status: false,
        statusCode: HttpStatus.NOT_FOUND, // 404
        message: `User ID ${id} not found.`,
        errors: res.errors,
        data: null,
      });
    }

    // Thành công
    return new ResponseModel({
      status: true,
      statusCode: HttpStatus.OK, // 200
      message: `User ID ${id} deleted successfully`,
      data: res.user, // Trả về thông tin User đã xóa (hoặc null nếu API yêu cầu 204)
    });
  }
}
