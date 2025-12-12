import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { PermissionService } from './permission.service';
import { ResponsePermissionDto } from './dto/response-permission.dto';
import { ResponseModel } from 'src/response-model/model/response-model.model';
import { CreatePermissionDto } from './dto/create-permission.dto';
import { UpdatePermissionDto } from './dto/update-permission.dto';

@UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
@Controller('permissions')
export class PermissionController {
  constructor(private readonly permServ: PermissionService) {}

  @Get()
  async findAll(): Promise<ResponseModel> {
    try {
      const res = await this.permServ.findAll();
      return new ResponseModel({
        status: true,
        statusCode: 200,
        message: 'Thành công',
        data: res,
      });
    } catch (err) {
      return new ResponseModel({
        status: false,
        statusCode: 500,
        message: 'Có lỗi xảy ra',
        data: null,
      });
    }
  }

  @Get(':id')
  async findById(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<ResponseModel> {
    try {
      const res = await this.permServ.findById(id);
      if (!res) {
        return new ResponseModel({
          status: false,
          statusCode: 404,
          message: `Không tìm thấy Quyền với id: ${id}`,
          data: null,
        });
      }
      return new ResponseModel({
        status: true,
        statusCode: 200,
        message: 'Thành công',
        data: res,
      });
    } catch (err) {
      return new ResponseModel({
        status: false,
        statusCode: 500,
        message: `Có lỗi xảy ra: ${err}`,
        data: null,
      });
    }
  }

  @Post()
  async create(@Body() body: CreatePermissionDto): Promise<ResponseModel> {
    try {
      const res = await this.permServ.create(body);
      if (!res)
        return new ResponseModel({
          status: false,
          statusCode: 500,
          message: `Không thể tạo quyền ${body.name}`,
          data: null,
        });
      if (res.errors.length > 0) {
        return new ResponseModel({
          status: false,
          statusCode: 500,
          message: `Có ${res.errors.length} lỗi xảy ra ${body.name}`,
          errors: res.errors,
          data: null,
        });
      }
      return new ResponseModel({
        status: true,
        statusCode: 200,
        message: `Thành công`,
        data: res.permission,
      });
    } catch (err) {
      return new ResponseModel({
        status: false,
        statusCode: 500,
        message: `Có lỗi xảy ra: ${err}`,
        data: null,
      });
    }
  }

  @Put(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: UpdatePermissionDto,
  ): Promise<ResponseModel> {
    try {
      const res = await this.permServ.update(id, body);
      if (!res)
        return new ResponseModel({
          status: false,
          statusCode: 500,
          message: `Không thể cập nhật quyền ${body.name}`,
          data: null,
        });
      if (res.errors.length > 0)
        return new ResponseModel({
          status: false,
          statusCode: 500,
          message: `Không thể cập nhật quyền ${body.name}`,
          errors: res.errors,
          data: null,
        });
      return new ResponseModel({
        status: true,
        statusCode: 200,
        message: `Thành công`,
        data: res.permission,
      });
    } catch (err) {
      return new ResponseModel({
        status: false,
        statusCode: 500,
        message: `Có lỗi xảy ra: ${err}`,
        data: null,
      });
    }
  }

  @Delete(':id')
  async delete(@Param('id', ParseIntPipe) id): Promise<ResponseModel> {
    try {
      const res = await this.permServ.delete(id);
      if (!res)
        return new ResponseModel({
          status: false,
          statusCode: 500,
          message: `Không thể xóa quyền với Id ${id}`,
          data: null,
        });
      if (res.errors.length > 0)
        return new ResponseModel({
          status: false,
          statusCode: 500,
          message: `Không thể xóa quyền với Id ${id}`,
          errors: res.errors,
          data: null,
        });
      return new ResponseModel({
        status: true,
        statusCode: 200,
        message: `Thành công`,
        data: res.permission,
      });
    } catch (err) {
      return new ResponseModel({
        status: false,
        statusCode: 500,
        message: `Có lỗi xảy ra: ${err}`,
        data: null,
      });
    }
  }
}
