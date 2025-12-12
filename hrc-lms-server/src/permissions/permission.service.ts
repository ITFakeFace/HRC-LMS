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
        'PermissionSerivce.findAll: Cannot get all Permission',
        err,
      );
    }
    return new ResponsePermissionDto[0]();
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
    if (createDto.name && this.findByName(createDto.name) != null) {
      res.pushError({
        key: 'name',
        value: `Tên quyền ${createDto.name} đã tồn tại`,
      });
      return res;
    }
    const newPerm = await this.permRepo.create(createDto);
    if (!newPerm) return res;
    res.permission = PermissionMapper.fromModelToDto(newPerm);
    return res;
  }

  async update(
    id: number,
    updateDto: UpdatePermissionDto,
  ): Promise<ResponsePermissionDto | null> {
    const res = new ResponsePermissionDto();
    const old = await this.findById(updateDto.id);
    const exist = await this.findByName(updateDto.name);
    if (!old) {
      res.pushError({
        key: 'global',
        value: `Quyền ${id} không tồn tại`,
      });
      return res;
    }
    if (old?.name != updateDto.name && exist != null) {
      res.pushError({
        key: 'name',
        value: `Tên quyền ${updateDto.name} đã tồn tại`,
      });
      return res;
    }
    try {
      const updatedPerm = await this.permRepo.update(id, updateDto);
      if (!updatedPerm) return res;
      res.permission = PermissionMapper.fromModelToDto(updatedPerm);
    } catch {
      res.pushError({ key: 'global', value: 'Lỗi không xác định' });
    }
    return res;
  }

  async delete(id: number): Promise<ResponsePermissionDto | null> {
    const res = new ResponsePermissionDto();
    try {
      const delPerm = await this.permRepo.delete(id);
      if (!delPerm)
        res.pushError({
          key: 'global',
          value: `Không thể xóa quyền với Id ${id}`,
        });
      res.permission = PermissionMapper.fromModelToDto(delPerm);
    } catch (err) {
      if (err instanceof NotFoundException) {
        res.pushError({
          key: 'global',
          value: `Không tìm thấy quyền với Id ${id}`,
        });
      } else {
        res.pushError({
          key: 'global',
          value: `Lỗi không xác định`,
        });
      }
    }
    return res;
  }
}
