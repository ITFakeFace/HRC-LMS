import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  UseGuards,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
  Put,
  Query,
} from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { CreateClassDto } from './dto/create-class.dto';
import { UpdateClassDto } from './dto/update-class.dto';
import { ResponseModel } from 'src/response-model/model/response-model.model';
import { ClassesService } from './class.service';

@Controller('classes')
@UseGuards(JwtAuthGuard)
export class ClassesController {
  constructor(private readonly classesService: ClassesService) {}

  // 1. CREATE (Tạo lớp + Tự động sinh lịch)
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createClassDto: CreateClassDto): Promise<ResponseModel> {
    const res = await this.classesService.create(createClassDto);

    if (res.hasErrors()) {
      return new ResponseModel({
        status: false,
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'Create Class Failed',
        errors: res.errors,
        data: null,
      });
    }

    return new ResponseModel({
      status: true,
      statusCode: HttpStatus.CREATED,
      message: 'Class created and schedule generated successfully',
      data: res.classData,
    });
  }

  // 2. READ ALL (Filter by Course or Lecturer)
  @Get()
  @HttpCode(HttpStatus.OK)
  async findAll(
    @Query('courseId') courseId?: string,
    @Query('lecturerId') lecturerId?: string,
  ): Promise<ResponseModel> {
    const data = await this.classesService.findAll(
      courseId ? +courseId : undefined,
      lecturerId ? +lecturerId : undefined,
    );

    return new ResponseModel({
      status: true,
      statusCode: HttpStatus.OK,
      message: 'Classes retrieved successfully',
      data: data,
    });
  }

  // 3. READ ONE
  @Get(':id')
  @HttpCode(HttpStatus.OK)
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<ResponseModel> {
    const res = await this.classesService.findOne(id);

    if (res.hasErrors()) {
      return new ResponseModel({
        status: false,
        statusCode: HttpStatus.NOT_FOUND,
        message: 'Class not found',
        errors: res.errors,
        data: null,
      });
    }

    return new ResponseModel({
      status: true,
      statusCode: HttpStatus.OK,
      message: 'Class retrieved successfully',
      data: res.classData,
    });
  }

  // 4. UPDATE
  @Put(':id')
  @HttpCode(HttpStatus.OK)
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateClassDto: UpdateClassDto,
  ): Promise<ResponseModel> {
    const res = await this.classesService.update(id, updateClassDto);

    if (res.hasErrors()) {
      return new ResponseModel({
        status: false,
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'Update Class Failed',
        errors: res.errors,
        data: null,
      });
    }

    return new ResponseModel({
      status: true,
      statusCode: HttpStatus.OK,
      message: 'Class updated successfully',
      data: res.classData,
    });
  }

  // 5. DELETE
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async remove(@Param('id', ParseIntPipe) id: number): Promise<ResponseModel> {
    const res = await this.classesService.remove(id);

    if (res.hasErrors()) {
      return new ResponseModel({
        status: false,
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'Cannot delete class',
        errors: res.errors,
        data: null,
      });
    }

    return new ResponseModel({
      status: true,
      statusCode: HttpStatus.OK,
      message: 'Class deleted successfully',
      data: res.classData,
    });
  }
}