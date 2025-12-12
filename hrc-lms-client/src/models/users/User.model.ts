import { Permission } from "@/src/features/permissions/interfaces/Permission.interface";
import { Role } from "@/src/features/roles/interfaces/Role.interface";

export class User {
  id?: number;
  pID?: string;
  username?: string;
  phone?: string;
  email?: string;
  avatar?: string;
  fullname?: string;
  gender?: boolean;
  dob?: Date;
  isEmailVerified?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
  lockoutEnd?: Date;
}
export class UserWithFullAuth extends User {
  roles: Role[] = [];
  permissions: Permission[] = [];
}
export class UserWithBasicAuth extends User {
  permissions: string[] = [];
  roles: string[] = [];
}
