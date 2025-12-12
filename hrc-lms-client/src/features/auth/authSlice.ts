// src/features/auth/authSlice.ts
import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import axios from "axios";
import Cookies from "js-cookie";
import { AuthState } from "./interfaces/AuthState.interface";
import { AuthResponse } from "./interfaces/AuthResponse.interface";
import { UserData } from "./interfaces/UserData.interface";
import { ApiResponse } from "./interfaces/ApiResponse.interface";

// --- INITIAL STATE ---
const initialState: AuthState = {
  accessToken: Cookies.get("accessToken") || null,
  refreshToken: Cookies.get("refreshToken") || null,
  user: null,
  permissions: [],
  roles: [],
  isAuthenticated: false,
  status: Cookies.get("accessToken") ? "loading" : "idle",
  error: null,
};

// --- HELPER: Lấy message lỗi từ API ---
const extractErrorMessage = (errorData: any): string => {
  if (
    errorData?.errors &&
    Array.isArray(errorData.errors) &&
    errorData.errors.length > 0
  ) {
    const firstError = errorData.errors[0];
    if (firstError.value && firstError.value.length > 0) {
      return firstError.value[0];
    }
  }
  return errorData?.message || errorData?.error || "Đã xảy ra lỗi";
};

// --- THUNK 1: ĐĂNG NHẬP ---
export const loginUser = createAsyncThunk<AuthResponse, LoginPayload>(
  "auth/loginUser",
  async ({ email, password, rememberMe }, { rejectWithValue }) => {
    try {
      // Dynamic Import để tránh Circular Dependency
      const { default: api } = await import("@/src/api/api");

      const response = await api.post<ApiResponse<AuthResponse>>(
        "/auth/login",
        { email, password, rememberMe }
      );

      const responseBody = response.data;

      // Check logical status
      if (!responseBody.status) {
        throw { response: { data: responseBody } };
      }

      // Lấy data (bao gồm token và user info)
      const { accessToken, refreshToken } = responseBody.data;

      Cookies.set("accessToken", accessToken, { expires: 1 }); 
      const refreshTokenExpiry = rememberMe ? 30 : 1; 
      Cookies.set("refreshToken", refreshToken, {
        expires: refreshTokenExpiry,
      });

      return responseBody.data;
    } catch (error: any) {
      if (axios.isAxiosError(error) && error.response) {
        return rejectWithValue(extractErrorMessage(error.response.data));
      }
      if (error.response?.data) {
        return rejectWithValue(extractErrorMessage(error.response.data));
      }
      return rejectWithValue("Lỗi kết nối đến máy chủ");
    }
  }
);

// --- THUNK 2: LẤY THÔNG TIN USER (Khi F5 trang) ---
export const fetchCurrentUser = createAsyncThunk<UserData>(
  "auth/fetchCurrentUser",
  async (_, { rejectWithValue }) => {
    try {
      const { default: api } = await import("@/src/api/api");

      // Gọi API lấy profile (Backend cần có endpoint này, ví dụ /auth/me hoặc /users/profile)
      // Giả sử API trả về ApiResponse<UserData> (chỉ chứa UserData trong data, không có token)
      const response = await api.get<ApiResponse<UserData>>("/auth/me");

      const responseBody = response.data;

      if (!responseBody.status) {
        throw { response: { data: responseBody } };
      }

      return responseBody.data;
    } catch (error: any) {
      // Nếu gọi /me thất bại (VD: 401 Unauthorized), nghĩa là token cookie không còn dùng được
      return rejectWithValue("Phiên đăng nhập hết hạn");
    }
  }
);

// --- THUNK 3: ĐĂNG XUẤT ---
export const logoutUser = createAsyncThunk(
  "auth/logoutUser",
  async (_, { dispatch }) => {
    // 1. Xóa Cookies
    Cookies.remove("accessToken");
    Cookies.remove("refreshToken");
    // 2. Reset State
    dispatch(authSlice.actions.logOut());
  }
);

// --- SLICE ---
export const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    logOut: (state) => {
      state.accessToken = null;
      state.refreshToken = null;
      state.user = null;
      state.permissions = [];
      state.roles = [];
      state.isAuthenticated = false;
      state.status = "idle";
      state.error = null;
    },
    setNewAccessToken: (state, action: PayloadAction<string>) => {
      state.accessToken = action.payload;
    },
    setUserData: (state, action: PayloadAction<UserData>) => {
      state.user = action.payload;
      state.permissions = action.payload.permissions || [];
      state.roles = action.payload.roles || [];
      state.isAuthenticated = true;
    },
    setUnauthenticated: (state) => {
      state.user = null;
      state.isAuthenticated = false;
      state.status = "failed";
      state.accessToken = null;
      state.refreshToken = null;
      Cookies.remove("accessToken");
      Cookies.remove("refreshToken");
    },
  },
  extraReducers: (builder) => {
    // 1. Xử lý Login
    builder
      .addCase(loginUser.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.isAuthenticated = true;
        state.accessToken = action.payload.accessToken;
        state.refreshToken = action.payload.refreshToken;
        state.user = action.payload.user;

        // Map roles/permissions từ user
        state.roles = action.payload.user.roles || [];
        state.permissions = action.payload.user.permissions || [];
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.status = "failed";
        state.error = (action.payload as string) || "Đăng nhập thất bại";
        state.isAuthenticated = false;
      });

    // 2. Xử lý Fetch Current User (Hydration)
    builder
      .addCase(fetchCurrentUser.pending, (state) => {
        // Không set status='loading' global để tránh flash loading toàn trang nếu muốn chạy ngầm
        // Hoặc set "loading" nếu muốn hiện Spinner khi F5
        state.status = "loading";
      })
      .addCase(fetchCurrentUser.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.isAuthenticated = true;
        state.user = action.payload; // payload lúc này chỉ là UserData

        // Map roles/permissions
        state.roles = action.payload.roles || [];
        state.permissions = action.payload.permissions || [];
      })
      .addCase(fetchCurrentUser.rejected, (state) => {
        state.status = "failed";
        state.isAuthenticated = false;
        state.user = null;
        state.accessToken = null;
        state.refreshToken = null;
        Cookies.remove("accessToken");
        Cookies.remove("refreshToken");
      });
  },
});

export const { logOut, setNewAccessToken, setUserData, setUnauthenticated } =
  authSlice.actions;
export const authReducer = authSlice.reducer;
export default authSlice.reducer;
