import {
  Controller,
  Post,
  Body,
  Put,
  Param,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
  Get,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { RoleService } from './role.service';
import { ResponseRoleDto } from './dto/response-role.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { ResponseModel } from 'src/response-model/model/response-model.model';

@Controller('roles')
@UseGuards(JwtAuthGuard)
export class RoleController {
  constructor(private readonly roleService: RoleService) {}

  // --- READ ---

  @Get()
  async findAll(): Promise<ResponseModel> {
    const result = await this.roleService.findAll();
    return new ResponseModel({
      status: true,
      statusCode: 200,
      message: 'Success',
      data: result,
    });
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<ResponseModel> {
    const result = await this.roleService.findById(id);
    if (result.errors.length > 0) {
      return new ResponseModel({
        status: false,
        statusCode: 404,
        message: 'Not Found',
        errors: result.errors,
        data: result,
      });
    }
    return new ResponseModel({
      status: true,
      statusCode: 200,
      message: 'Success',
      data: result,
    });
  }

  // --- CREATE ---

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createRoleDto: CreateRoleDto): Promise<ResponseModel> {
    const result = await this.roleService.create(createRoleDto);
    if (result.errors.length > 0) {
      return new ResponseModel({
        status: false,
        statusCode: 500,
        message: 'Failed',
        errors: result.errors,
        data: result,
      });
    }
    return new ResponseModel({
      status: true,
      statusCode: 200,
      message: 'Success',
      data: result,
    });
  }

  // --- UPDATE ---

  @Put(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() data: UpdateRoleDto,
  ): Promise<ResponseModel> {
    const result = await this.roleService.update(id, data);
    if (result.errors.length > 0) {
      return new ResponseModel({
        status: false,
        statusCode: 500,
        message: 'Failed',
        errors: result.errors,
        data: result,
      });
    }
    return new ResponseModel({
      status: true,
      statusCode: 200,
      message: 'Success',
      data: result,
    });
  }

  // --- DELETE ---

  @Delete(':id')
  async delete(@Param('id', ParseIntPipe) id: number): Promise<ResponseModel> {
    const result = await this.roleService.delete(id);
    if (result.errors.length > 0) {
      return new ResponseModel({
        status: false,
        statusCode: 500,
        message: 'Failed',
        errors: result.errors,
        data: result,
      });
    }
    return new ResponseModel({
      status: true,
      statusCode: 200,
      message: 'Success',
      data: result,
    });
  }
}
