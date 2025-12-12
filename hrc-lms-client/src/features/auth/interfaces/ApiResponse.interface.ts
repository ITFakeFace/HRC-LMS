// src/features/auth/interfaces/ApiResponse.interface.ts
export interface ApiErrorDetail {
  key: string;
  value: string[];
}

export interface ApiResponse<T> {
  status: boolean;
  statusCode: number;
  message: string;
  errors?: ApiErrorDetail[];
  data: T;
}
