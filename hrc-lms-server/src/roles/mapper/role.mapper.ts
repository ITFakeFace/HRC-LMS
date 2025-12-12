import { Prisma, Role } from '@prisma/client';
import { BasicRoleDto, RoleDto } from '../dto/role.dto';
import { CreateRoleDto } from '../dto/create-role.dto';
import { MappingException } from 'src/exceptions/MappingException';
import { UpdateRoleDto } from '../dto/update-role.dto';
import { ResponseRoleDto } from '../dto/response-role.dto';
import { RoleFullModel } from '../dto/RoleFullModel';

export class RoleMapper {
  static fromCreateToDto(createDto: CreateRoleDto): BasicRoleDto {
    const res = new BasicRoleDto();
    if (!createDto.fullname || !createDto.shortname) {
      throw new MappingException(
        'RoleMapper[fromCreateToDto]: Cannot map if there is/are null required fields',
      );
    }
    res.fullname = createDto.fullname;
    res.shortname = createDto.shortname;
    return res;
  }

  static fromUpdateToDto(updateDto: UpdateRoleDto): BasicRoleDto {
    const res = new BasicRoleDto();
    if (!updateDto.id || !updateDto.fullname || !updateDto.shortname) {
      throw new MappingException(
        'RoleMapper[fromUpdateToDto]: Cannot map if there is/are null required fields',
      );
    }
    res.id = updateDto.id;
    res.fullname = updateDto.fullname;
    res.shortname = updateDto.shortname;
    return res;
  }

  static fromDtoToCreate(dto: RoleDto): CreateRoleDto {
    const res = new CreateRoleDto();
    if (!dto.shortname || !dto.fullname) {
      throw new MappingException(
        'RoleMapper[fromDtoToCreate]: Cannot map if there is/are null required field(s)',
      );
    }
    res.shortname = dto.shortname;
    res.fullname = dto.fullname;
    res.parentRoles = dto.parentRoles.map((parent) => parent.id!);
    res.permissions = dto.permissions.map((perm) => perm.id!);
    return res;
  }

  static fromDtoToUpdate(dto: RoleDto): UpdateRoleDto {
    const res = new UpdateRoleDto();
    if (!dto.shortname || !dto.fullname) {
      throw new MappingException(
        'RoleMapper[fromDtoToUpdate]: Cannot map if there is/are null required field(s)',
      );
    }
    res.shortname = dto.shortname;
    res.fullname = dto.fullname;
    res.parentRoles = dto.parentRoles.map((parent) => parent.id!);
    res.permissions = dto.permissions.map((perm) => perm.id!);
    return res;
  }

  static fromDtoToResponse(dto: RoleDto): ResponseRoleDto {
    const res = new ResponseRoleDto();
    if (!dto.id || !dto.fullname || !dto.shortname) {
      throw new MappingException(
        'RoleMapper[fromDtoToResponse]: Cannot map if there is/are null required field(s)',
      );
    }
    res.role = {
      ...dto,
      id: dto.id,
      fullname: dto.fullname,
      shortname: dto.shortname,
    };
    return res;
  }

  static fromModelToDto(model: RoleFullModel): RoleDto {
    if (!model.id || !model.fullname || !model.shortname) {
      throw new MappingException(
        'RoleMapper[fromModelToDto]: Cannot map if there is/are null required field(s)',
      );
    }
    const res: RoleDto = {
      id: model.id,
      fullname: model.fullname,
      shortname: model.shortname,
      users: model.users,
      permissions: model.permissions,
      parentRoles: model.parentRoles.map((role) => role.parent),
      childRoles: model.childRoles.map((role) => role.child),
    };
    return res;
  }

  static fromModelToResponse(model: RoleFullModel): ResponseRoleDto {
    const res = new ResponseRoleDto();
    if (!model.id || !model.fullname || !model.shortname) {
      throw new MappingException(
        'RoleMapper[fromModelToResponse]: Cannot map if there is/are null required field(s)',
      );
    }
    res.role = {
      id: model.id,
      fullname: model.fullname,
      shortname: model.shortname,
      parentRoles: model.parentRoles.map((role) => role.parent),
      childRoles: model.childRoles.map((role) => role.child),
      permissions: model.permissions,
      users: model.users,
    };
    return res;
  }

  static fromDtoToModel(model: RoleFullModel): RoleDto {
    const res = new RoleDto();
    if (!model.id || !model.fullname || !model.shortname) {
      throw new MappingException(
        'RoleMapper[fromDtoToModel]: Cannot map if there is/are null required field(s)',
      );
    }
    res.id = model.id;
    res.fullname = model.fullname;
    res.shortname = model.shortname;
    res.parentRoles = model.parentRoles.map((role) => role.parent);
    res.childRoles = model.childRoles.map((role) => role.child);
    res.permissions = model.permissions;
    return res;
  }
}
