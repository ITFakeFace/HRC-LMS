import { Permission } from "@prisma/client";
import { BasicRoleDto } from "src/roles/dto/role.dto";

export class BasicUserDto {
  id: number;
  pID: string;
  password?: string | null;
  username: string;
  phone?: string | null;
  email: string;
  avatar?: string | null;
  fullname: string;
  gender: boolean;
  dob: Date | string;
  lockoutEnd?: Date | string | null;
  isEmailVerified: boolean;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export class UserDto extends BasicUserDto {
  // Quan hệ (nếu cần)
  roles?: string[] |  BasicRoleDto[] | null = [];
  permissions?: string[] | Permission[] | null = [];
}

export class FlatteredUserDto extends BasicUserDto {
  // Quan hệ (nếu cần)
  roles?: number[] | null = [];
  permissions?: number[] | null = [];
}
