import { UserData } from "./UserData.interface";

export interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  user: UserData | null;
  permissions: string[];
  roles: string[];
  isAuthenticated: boolean;
  status: "idle" | "loading" | "succeeded" | "failed";
  error: string | null;
}
