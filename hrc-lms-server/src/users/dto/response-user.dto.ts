import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsDate,
  IsEmail,
  IsInt,
  IsOptional,
  IsString,
} from 'class-validator';
import { ResponsePermissionDto } from 'src/permissions/dto/response-permission.dto';
import { ResponseRoleDto } from 'src/roles/dto/response-role.dto';
import { UserDto } from './user.dto';
import { ResponseError } from 'src/response-model/model/response-model.model';
import { ErrorsModel } from 'src/response-model/model/errors-model.mdel';

export class ResponseUserDto extends ErrorsModel {
  user: UserDto | null;
}
