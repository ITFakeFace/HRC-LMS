import { Injectable } from '@nestjs/common';
import { CreateClassDto } from './dto/create-class.dto';
import { UpdateClassDto } from './dto/update-class.dto';
import { ClassDto } from './dto/class.dto';
import { ResponseClassDto } from './dto/response-class.dto';
import { Class } from '@prisma/client';
import { ClassRepository } from './class.repository';

@Injectable()
export class ClassesService {
  constructor(private readonly classRepository: ClassRepository) {}

  // === 1. CREATE ===
  async create(createClassDto: CreateClassDto): Promise<ResponseClassDto> {
    const res = new ResponseClassDto();

    // 1. Validate: Kiểm tra trùng mã lớp (Code)
    // Lưu ý: Cần đảm bảo ClassRepository có hàm tìm theo Code hoặc dùng try/catch P2002
    // Ở đây tôi dùng try/catch để bao quát trường hợp Unique Constraint
    
    // 2. Thực thi tạo mới
    try {
      const newClass = await this.classRepository.create(createClassDto);
      res.classData = this.mapToDto(newClass);
    } catch (error) {
      console.error('Lỗi khi tạo Class:', error);
      // Xử lý lỗi trùng mã lớp (Prisma error code P2002)
      if (error.code === 'P2002' && error.meta?.target?.includes('code')) {
        res.pushError({
          key: 'code',
          value: 'Mã lớp đã tồn tại.',
        });
      } else {
        res.pushError({
          key: 'global',
          value: 'Lỗi không mong muốn trong quá trình tạo lớp học.',
        });
      }
    }

    return res;
  }

  // === 2. FIND ALL ===
  async findAll(courseId?: number): Promise<ClassDto[]> {
    const classes = await this.classRepository.findAll(courseId);
    return classes.map(cls => this.mapToDto(cls));
  }

  // === 3. FIND ONE ===
  async findOne(id: number): Promise<ResponseClassDto> {
    const res = new ResponseClassDto();
    const foundClass = await this.classRepository.findById(id);

    if (!foundClass) {
      res.pushError({
        key: 'id',
        value: `Lớp học với ID ${id} không tồn tại.`,
      });
      return res;
    }

    res.classData = this.mapToDto(foundClass);
    return res;
  }

  // === 4. UPDATE ===
  async update(id: number, updateClassDto: UpdateClassDto): Promise<ResponseClassDto> {
    const res = new ResponseClassDto();

    // 1. Kiểm tra tồn tại
    const existingClass = await this.classRepository.findById(id);
    if (!existingClass) {
      res.pushError({
        key: 'id',
        value: `Lớp học với ID ${id} không tồn tại.`,
      });
      return res;
    }

    // 2. Thực thi update
    try {
      const updatedClass = await this.classRepository.update(id, updateClassDto);
      res.classData = this.mapToDto(updatedClass);
    } catch (error) {
      console.error('Lỗi khi cập nhật Class:', error);
      if (error.code === 'P2002' && error.meta?.target?.includes('code')) {
        res.pushError({
          key: 'code',
          value: 'Mã lớp mới bị trùng lặp.',
        });
      } else {
        res.pushError({
          key: 'global',
          value: 'Lỗi không mong muốn trong quá trình cập nhật lớp học.',
        });
      }
    }

    return res;
  }

  // === 5. REMOVE ===
  async remove(id: number): Promise<ResponseClassDto> {
    const res = new ResponseClassDto();

    // 1. Kiểm tra tồn tại
    const existingClass = await this.classRepository.findById(id);
    if (!existingClass) {
      res.pushError({
        key: 'id',
        value: `Lớp học với ID ${id} không tồn tại.`,
      });
      return res;
    }

    // 2. Thực thi xóa
    try {
      const deletedClass = await this.classRepository.delete(id);
      res.classData = this.mapToDto(deletedClass);
    } catch (error) {
      console.error('Lỗi khi xóa Class:', error);
      res.pushError({
        key: 'global',
        value: 'Không thể xóa lớp học này (có thể do đang có học sinh hoặc dữ liệu liên kết).',
      });
    }

    return res;
  }

  // === Helper Map ===
  private mapToDto(data: Class): ClassDto {
    return {
      id: data.id,
      code: data.code,
      name: data.name,
      startDate: data.startDate,
      endDate: data.endDate,
      status: data.status,
      courseId: data.courseId,
    };
  }
}