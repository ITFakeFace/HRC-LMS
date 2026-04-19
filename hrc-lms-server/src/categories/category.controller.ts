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
} from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
// Giả định đường dẫn ResponseModel giống ví dụ của bạn
import { ResponseModel } from 'src/response-model/model/response-model.model';
import { CategoriesService } from './category.service';

@Controller('categories')
@UseGuards(JwtAuthGuard)
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  // 1. CREATE (POST /categories)
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createCategoryDto: CreateCategoryDto): Promise<ResponseModel> {
    const res = await this.categoriesService.create(createCategoryDto);

    // Kiểm tra lỗi từ Service (Logic validation thủ công)
    if (res.hasErrors()) {
      return new ResponseModel({
        status: false,
        statusCode: HttpStatus.BAD_REQUEST, // 400
        message: 'Validation Failed or Creation Error',
        errors: res.errors,
        data: null,
      });
    }

    // Thành công
    return new ResponseModel({
      status: true,
      statusCode: HttpStatus.CREATED, // 201
      message: 'Category created successfully',
      data: res.category,
    });
  }

  // 2. READ ALL (GET /categories)
  @Get()
  @HttpCode(HttpStatus.OK)
  async findAll(): Promise<ResponseModel> {
    const res = await this.categoriesService.findAll();
    
    return new ResponseModel({
      status: true,
      statusCode: HttpStatus.OK, // 200
      message: 'Categories retrieved successfully',
      data: res, // res là mảng CategoryDto[]
    });
  }

  // 3. READ ONE (GET /categories/:id)
  @Get(':id')
  @HttpCode(HttpStatus.OK)
  async findById(@Param('id', ParseIntPipe) id: number): Promise<ResponseModel> {
    const res = await this.categoriesService.findOne(id);

    if (res.hasErrors()) {
      // Nếu lỗi là do ID không tồn tại -> Trả về 404
      if (res.errors.some((err) => err.key === 'id')) {
        return new ResponseModel({
          status: false,
          statusCode: HttpStatus.NOT_FOUND, // 404
          message: `Category with ID ${id} not found.`,
          errors: res.errors,
          data: null,
        });
      }

      // Các lỗi khác -> Trả về 400
      return new ResponseModel({
        status: false,
        statusCode: HttpStatus.BAD_REQUEST, // 400
        message: 'Error retrieving category data.',
        errors: res.errors,
        data: null,
      });
    }

    return new ResponseModel({
      status: true,
      statusCode: HttpStatus.OK, // 200
      message: `Category ID ${id} retrieved successfully`,
      data: res.category,
    });
  }

  // 4. UPDATE (PUT /categories/:id)
  @Put(':id')
  @HttpCode(HttpStatus.OK)
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateCategoryDto: UpdateCategoryDto,
  ): Promise<ResponseModel> {
    const res = await this.categoriesService.update(id, updateCategoryDto);

    if (res.hasErrors()) {
      // Ưu tiên check lỗi 404 (ID không tồn tại)
      if (res.errors.some((err) => err.key === 'id')) {
        return new ResponseModel({
          status: false,
          statusCode: HttpStatus.NOT_FOUND, // 404
          message: `Category with ID ${id} not found.`,
          errors: res.errors,
          data: null,
        });
      }

      // Các lỗi validation khác (ví dụ: trùng tên) -> 400
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
      message: `Category ID ${id} updated successfully`,
      data: res.category,
    });
  }

  // 5. DELETE (DELETE /categories/:id)
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async remove(@Param('id', ParseIntPipe) id: number): Promise<ResponseModel> {
    const res = await this.categoriesService.remove(id);

    if (res.hasErrors()) {
      // Lỗi 404 Not Found
      if (res.errors.some((err) => err.key === 'id')) {
        return new ResponseModel({
          status: false,
          statusCode: HttpStatus.NOT_FOUND, // 404
          message: `Category with ID ${id} not found.`,
          errors: res.errors,
          data: null,
        });
      }
      
      // Lỗi khác (ví dụ: Ràng buộc khóa ngoại, không xóa được) -> 400
      return new ResponseModel({
        status: false,
        statusCode: HttpStatus.BAD_REQUEST, // 400
        message: 'Cannot delete category.',
        errors: res.errors,
        data: null,
      });
    }

    // Thành công
    return new ResponseModel({
      status: true,
      statusCode: HttpStatus.OK, // 200
      message: `Category ID ${id} deleted successfully`,
      data: res.category, // Trả về thông tin category đã xóa
    });
  }
}