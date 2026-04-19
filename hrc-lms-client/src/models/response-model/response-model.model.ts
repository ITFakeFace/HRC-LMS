interface ApiResponse<T> {
  status: boolean;
  statusCode: number;
  message: string;
  data: T | null;
  errors?: ApiError[];
}

interface ApiError {
  key: string;
  value: string[];
}
