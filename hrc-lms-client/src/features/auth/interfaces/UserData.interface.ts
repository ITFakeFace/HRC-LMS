import { User } from "@/src/models/users/User.model";

export interface UserData {
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
  permissions: string[];
  roles: string[];
}
