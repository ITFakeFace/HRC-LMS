import { NotNullException } from 'src/exceptions/NotNullException';
import { CreatePermissionDto } from '../dto/create-permission.dto';
import { PermissionDto } from '../dto/permission.dto';
import { UpdatePermissionDto } from '../dto/update-permission.dto';
import { ResponsePermissionDto } from '../dto/response-permission.dto';
import { Permission } from '@prisma/client'; // Bỏ Prisma nếu không dùng trực tiếp type Prisma
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

    // FIX: Không check cứng name vì update có thể là partial (chỉ update description)
    // FIX: Không gán dto.id = updateDto.id vì UpdatePermissionDto đã xóa trường id

    if (updateDto.name) dto.name = updateDto.name;
    if (updateDto.description) dto.description = updateDto.description;

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

    // FIX: Bỏ check ID vì UpdatePermissionDto không chứa ID
    // Chỉ map các dữ liệu cần thiết
    if (dto.name) updateDto.name = dto.name;
    if (dto.description) updateDto.description = dto.description;

    return updateDto;
  }

  static fromDtoToResponse(dto: PermissionDto): ResponsePermissionDto {
    const responseDto = new ResponsePermissionDto();
    // Vẫn giữ check ID ở đây vì Response trả về client phải có ID
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
    // Lưu ý: model.id là số 0 vẫn hợp lệ, nên check undefined/null thay vì !model.id
    if (model.id === undefined || model.id === null || !model.name) {
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
    if (model.id === undefined || model.id === null || !model.name) {
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
