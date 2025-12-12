import { NotNullException } from 'src/exceptions/NotNullException';
import { CreatePermissionDto } from '../dto/create-permission.dto';
import { PermissionDto } from '../dto/permission.dto';
import { UpdatePermissionDto } from '../dto/update-permission.dto';
import { ResponsePermissionDto } from '../dto/response-permission.dto';
import { Permission, Prisma } from '@prisma/client';
import { MappingException } from 'src/exceptions/MappingException';

export class PermissionMapper {
  static fromCreateToDto(createDto: CreatePermissionDto): PermissionDto {
    const dto = new PermissionDto();
    if (!createDto.name) {
      throw new MappingException(
        'PermissionMapper[fromCreateToDto]: Cannot map if there is/are null required fields',
      );
    }
    dto.name = createDto.name;
    dto.description = createDto.description;
    return dto;
  }

  static fromUpdateToDto(updateDto: UpdatePermissionDto): PermissionDto {
    const dto = new PermissionDto();
    if (!updateDto.name) {
      throw new MappingException(
        'PermissionMapper[fromUpdateToDto]: Cannot map if there is/are null required fields',
      );
    }
    // Gán các trường
    dto.id = updateDto.id;
    dto.name = updateDto.name;
    dto.description = updateDto.description;

    return dto;
  }

  static fromDtoToCreate(dto: PermissionDto): CreatePermissionDto {
    const createDto = new CreatePermissionDto();
    if (!dto.name) {
      throw new MappingException(
        'PermissionMapper[fromDtoToCreate]: Cannot map if there is/are null required fields',
      );
    }
    createDto.name = dto.name;
    createDto.description = dto.description;
    return createDto;
  }

  static fromDtoToUpdate(dto: PermissionDto): UpdatePermissionDto {
    const updateDto = new UpdatePermissionDto();
    if (!dto.id || !dto.name) {
      throw new MappingException(
        'PermissionMapper[fromDtoToUpdate]: Cannot map if there is/are null required fields',
      );
    }
    updateDto.id = dto.id;
    updateDto.name = dto.name;
    updateDto.description = dto.description;
    return updateDto;
  }

  static fromDtoToResponse(dto: PermissionDto): ResponsePermissionDto {
    const responseDto = new ResponsePermissionDto();
    if (!dto.id || !dto.name) {
      throw new MappingException(
        'PermissionMapper[fromDtoToResponse]: Cannot map if there is/are null required fields',
      );
    }
    responseDto.permission = {
      id: dto.id,
      name: dto.name,
      description: dto.description,
    };
    return responseDto;
  }

  static fromModelToDto(model: Permission): PermissionDto {
    const dto = new PermissionDto();
    if (!model.id || !model.name) {
      throw new MappingException(
        'PermissionMapper[fromModelToDto]: Cannot map if there is/are null required fields',
      );
    }
    dto.id = model.id;
    dto.name = model.name;
    dto.description = model.description;
    return dto;
  }

  static fromModelToResponse(model: Permission): ResponsePermissionDto {
    const dto = new ResponsePermissionDto();
    if (!model.id || !model.name) {
      throw new MappingException(
        'PermissionMapper[fromModelToResponse]: Cannot map if there is/are null required fields',
      );
    }
    dto.permission = {
      id: model.id,
      name: model.name,
      description: model.description,
    };
    return dto;
  }

  static fromListModelToListDto(models: Permission[]): PermissionDto[] {
    return models.map((model) => this.fromModelToDto(model));
  }

  static fromListModelToListResponse(
    models: Permission[],
  ): ResponsePermissionDto[] {
    return models.map((model) =>
      this.fromDtoToResponse(this.fromModelToDto(model)),
    );
  }
}
