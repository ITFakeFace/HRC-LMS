import { Injectable, NotFoundException } from '@nestjs/common';
import { PermissionRepository } from './permission.repository';
import { ResponsePermissionDto } from './dto/response-permission.dto';
import { PermissionMapper } from './mapper/permission.mapper';
import { CreatePermissionDto } from './dto/create-permission.dto';
import { UpdatePermissionDto } from './dto/update-permission.dto';
import { PermissionDto } from './dto/permission.dto';

@Injectable()
export class PermissionService {
  constructor(private permRepo: PermissionRepository) {}

  async findAll(): Promise<PermissionDto[]> {
    try {
      const res = await this.permRepo.findAll();
      return PermissionMapper.fromListModelToListDto(res);
    } catch (err) {
      console.error(
        'PermissionService.findAll: Cannot get all Permission',
        err,
      );
      return []; // Trả về mảng rỗng thay vì cú pháp sai
    }
  }

  async findById(id: number): Promise<PermissionDto | null> {
    const res = await this.permRepo.findById(id);
    if (!res) return null;
    return PermissionMapper.fromModelToDto(res);
  }

  async findByName(name: string): Promise<PermissionDto | null> {
    const res = await this.permRepo.findByName(name);
    if (!res) return null;
    return PermissionMapper.fromModelToDto(res);
  }

  async create(
    createDto: CreatePermissionDto,
  ): Promise<ResponsePermissionDto | null> {
    const res = new ResponsePermissionDto();

    // FIX: Phải có await ở đây
    const existingPerm = await this.findByName(createDto.name);
    if (existingPerm) {
      res.pushError({
        key: 'name',
        value: `Tên quyền ${createDto.name} đã tồn tại`,
      });
      return res;
    }

    try {
      const newPerm = await this.permRepo.create(createDto);
      res.permission = PermissionMapper.fromModelToDto(newPerm);
    } catch (error) {
      console.error(error);
      res.pushError({ key: 'global', value: 'Lỗi khi tạo quyền' });
    }

    return res;
  }

  async update(
    id: number,
    updateDto: UpdatePermissionDto,
  ): Promise<ResponsePermissionDto | null> {
    const res = new ResponsePermissionDto();

    // 1. Kiểm tra quyền có tồn tại không
    const old = await this.permRepo.findById(id); // Dùng trực tiếp repo để lấy model gốc
    if (!old) {
      res.pushError({
        key: 'global',
        value: `Quyền với id ${id} không tồn tại`,
      });
      return res;
    }

    // 2. Logic kiểm tra trùng tên (Chỉ check nếu có gửi name và name thay đổi)
    if (updateDto.name && updateDto.name !== old.name) {
      const exist = await this.findByName(updateDto.name);
      if (exist) {
        res.pushError({
          key: 'name',
          value: `Tên quyền "${updateDto.name}" đã được sử dụng`,
        });
        return res;
      }
    }

    try {
      // Loại bỏ id ra khỏi data update để tránh lỗi Prisma (nếu DTO có id)
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { id: _, ...dataToUpdate } = updateDto as any;

      const updatedPerm = await this.permRepo.update(id, dataToUpdate);
      res.permission = PermissionMapper.fromModelToDto(updatedPerm);
    } catch (err) {
      console.error(err);
      res.pushError({
        key: 'global',
        value: 'Lỗi không xác định khi cập nhật',
      });
    }
    return res;
  }

  async delete(id: number): Promise<ResponsePermissionDto | null> {
    const res = new ResponsePermissionDto();
    try {
      const delPerm = await this.permRepo.delete(id);
      res.permission = PermissionMapper.fromModelToDto(delPerm);
    } catch (err) {
      if (err instanceof NotFoundException) {
        res.pushError({
          key: 'global',
          value: `Không tìm thấy quyền với Id ${id}`,
        });
      } else {
        console.error(err);
        res.pushError({
          key: 'global',
          value: `Lỗi không xác định khi xóa`,
        });
      }
    }
    return res;
  }
}
