// src/roles/dto/role-response.dto.ts
import { PermissionDto } from 'src/permissions/dto/permission.dto';
import { FlatteredRoleDto, RoleDto } from './role.dto';
import { ResponseError } from 'src/response-model/model/response-model.model';
import { ErrorsModel } from 'src/response-model/model/errors-model.mdel';

export class ResponseRoleDto extends ErrorsModel {
  role: RoleDto;
}

export class ResponseFlatteredRoleDto {
  role: FlatteredRoleDto;
  errors: ResponseError[] = [];
}
