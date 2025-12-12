import { PermissionDto } from 'src/permissions/dto/permission.dto';
import { BasicUserDto, UserDto } from 'src/users/dto/user.dto';

export class BasicRoleDto {
  id: number;
  fullname: string;
  shortname: string;
}

export class RoleDto extends BasicRoleDto {
  users: BasicUserDto[] = [];
  permissions: PermissionDto[] = [];
  parentRoles: BasicRoleDto[] = [];
  childRoles: BasicRoleDto[] = [];
}

export class FlatteredRoleDto extends BasicRoleDto {
  users: number[] = [];
  permissions: number[] = [];
  parentRoles: number[] = [];
  childRoles: number[] = [];
}
