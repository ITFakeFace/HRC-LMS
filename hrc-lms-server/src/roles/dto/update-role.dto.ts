import {
  IsString,
  IsOptional,
  IsArray,
  IsInt,
  IsNumber,
  IsNotEmpty,
} from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateRoleDto {
  @IsNumber()
  @IsNotEmpty()
  id: number;

  @IsString()
  @IsNotEmpty()
  fullname: string;

  @IsString()
  @IsNotEmpty()
  shortname: string;

  @IsOptional()
  @IsArray()
  @IsInt({ each: true, message: 'Permission IDs phải là mảng số' })
  @Type(() => Number)
  permissions?: number[];

  @IsOptional()
  @IsArray()
  @IsInt({ each: true, message: 'Parent Role IDs phải là mảng số' })
  @Type(() => Number)
  parentRoles?: number[];
}
