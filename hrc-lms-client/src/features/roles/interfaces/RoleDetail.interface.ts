import { User } from "@/src/models/users/User.model";
import { Permission } from "../../permissions/interfaces/Permission.interface";

export interface RoleDetail {
  role: {
    id: number;
    fullname: string;
    shortname: string;
    users: User[];
    parentRoles: number[];
    childRoles: number[];
    permissions: Permission[];
  };
}
