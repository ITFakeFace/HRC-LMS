// src/categories/categories.service.ts
import { Injectable } from '@nestjs/common';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { CategoryDto } from './dto/category.dto';
import { ResponseCategoryDto } from './dto/response-category.dto';
import { Category } from '@prisma/client';
import { CategoriesRepository } from './category.repository';

@Injectable()
export class CategoriesService {
  constructor(private readonly categoriesRepository: CategoriesRepository) {}

  // === 1. CREATE ===
  async create(createCategoryDto: CreateCategoryDto): Promise<ResponseCategoryDto> {
    const res = new ResponseCategoryDto();

    // 1. Validate: Kiểm tra tên trùng lặp
    const existingCategory = await this.categoriesRepository.findByName(createCategoryDto.name);
    
    if (existingCategory) {
      res.pushError({ 
        key: 'name', 
        value: 'Tên danh mục đã tồn tại.' 
      });
    }

    // Nếu có lỗi validation -> Dừng và trả về ngay
    if (res.hasErrors()) {
      return res;
    }

    // 2. Thực thi tạo mới
    try {
      const newCategory = await this.categoriesRepository.create(createCategoryDto);
      res.category = this.mapToDto(newCategory);
    } catch (error) {
      console.error('Lỗi khi tạo Category:', error);
      res.pushError({
        key: 'global',
        value: 'Lỗi không mong muốn trong quá trình tạo danh mục.',
      });
    }

    return res;
  }

  // === 2. FIND ALL (Giữ nguyên trả về mảng DTO vì logic này thường không validate) ===
  async findAll(): Promise<CategoryDto[]> {
    const categories = await this.categoriesRepository.findAll();
    return categories.map(category => this.mapToDto(category));
  }

  // === 3. FIND ONE ===
  async findOne(id: number): Promise<ResponseCategoryDto> {
    const res = new ResponseCategoryDto();

    const category = await this.categoriesRepository.findById(id);

    if (!category) {
      res.pushError({
        key: 'id',
        value: `Danh mục với ID ${id} không tồn tại.`,
      });
      return res;
    }

    res.category = this.mapToDto(category);
    return res;
  }

  // === 4. UPDATE ===
  async update(id: number, updateCategoryDto: UpdateCategoryDto): Promise<ResponseCategoryDto> {
    const res = new ResponseCategoryDto();

    // 1. Kiểm tra tồn tại
    const existingCategory = await this.categoriesRepository.findById(id);
    if (!existingCategory) {
      res.pushError({
        key: 'id',
        value: `Danh mục với ID ${id} không tồn tại.`,
      });
      return res; // Dừng ngay nếu không tìm thấy ID
    }

    // 2. Validate logic: Kiểm tra trùng tên (nếu có update tên)
    if (updateCategoryDto.name) {
      const duplicateCheck = await this.categoriesRepository.findByName(updateCategoryDto.name);
      // Nếu tìm thấy tên trùng VÀ ID của cái tìm thấy khác với ID đang sửa
      if (duplicateCheck && duplicateCheck.id !== id) {
        res.pushError({
          key: 'name',
          value: 'Tên danh mục mới đã được sử dụng bởi danh mục khác.',
        });
      }
    }

    if (res.hasErrors()) {
      return res;
    }

    // 3. Thực thi update
    try {
      const updatedCategory = await this.categoriesRepository.update(id, updateCategoryDto);
      res.category = this.mapToDto(updatedCategory);
    } catch (error) {
      console.error('Lỗi khi cập nhật Category:', error);
      res.pushError({
        key: 'global',
        value: 'Lỗi không mong muốn trong quá trình cập nhật danh mục.',
      });
    }

    return res;
  }

  // === 5. REMOVE ===
  async remove(id: number): Promise<ResponseCategoryDto> {
    const res = new ResponseCategoryDto();

    // 1. Kiểm tra tồn tại
    const existingCategory = await this.categoriesRepository.findById(id);
    if (!existingCategory) {
      res.pushError({
        key: 'id',
        value: `Danh mục với ID ${id} không tồn tại.`,
      });
      return res;
    }

    // 2. Thực thi xóa
    try {
      const deletedCategory = await this.categoriesRepository.delete(id);
      res.category = this.mapToDto(deletedCategory);
    } catch (error) {
      console.error('Lỗi khi xóa Category:', error);
      // Có thể bắt thêm lỗi liên quan đến khóa ngoại (Foreign Key)
      // Ví dụ: Không thể xóa category đang có chứa Course
      res.pushError({
        key: 'global',
        value: 'Không thể xóa danh mục này (có thể do đang có dữ liệu liên kết).',
      });
    }

    return res;
  }

  // === Helper Map ===
  private mapToDto(category: Category): CategoryDto {
    return {
      id: category.id,
      name: category.name,
      description: category.description,
    };
  }
}