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
  // Thêm các Exception cần thiết nếu service ném ra (ví dụ: NotFoundException)
  NotFoundException,
  Put,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ResponseModel } from 'src/response-model/model/response-model.model';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

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
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateUserDto: UpdateUserDto,
  ): Promise<ResponseModel> {
    const res = await this.usersService.update(id, updateUserDto);

    // Kiểm tra nếu service trả về lỗi (từ ResponseUserDto)
    if (res.errors && res.errors.length > 0) {
      // Nếu có lỗi ID không tồn tại (lỗi 404)
      if (res.errors.some((err) => err.key === 'id')) {
        return new ResponseModel({
          status: false,
          statusCode: HttpStatus.NOT_FOUND, // 404
          message: 'User not found or Role ID missing',
          errors: res.errors,
          data: null,
        });
      }
      // Lỗi validation khác (trùng lặp email, username,...)
      return new ResponseModel({
        status: false,
        statusCode: HttpStatus.BAD_REQUEST, // 400
        message: 'Validation Failed or Update Error',
        errors: res.errors,
        data: null,
      });
    }

    // Thành công
    return new ResponseModel({
      status: true,
      statusCode: HttpStatus.OK, // 200
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
