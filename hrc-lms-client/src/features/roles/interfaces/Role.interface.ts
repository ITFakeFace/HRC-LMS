import { User } from "@/src/models/users/User.model";
import { Permission } from "../../permissions/interfaces/Permission.interface";

export interface Role {
  id: number;
  fullname: string;
  shortname: string;
  users: number[] | User[];
  parentRoles: number[];
  childRoles: number[];
  permissions: number[] | Permission[];
}
