import { UserData } from "./UserData.interface";

export interface AuthResponse extends UserData {
  accessToken: string;
  refreshToken: string;
  user: UserData; // Object user nằm lồng bên trong
  errors?: any[];
}
