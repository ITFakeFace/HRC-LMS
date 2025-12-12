import { logOut, setNewAccessToken } from "@/src/features/auth/authSlice";
import { store } from "@/src/store/store";
import axios from "axios";
import Cookies from "js-cookie";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

// 1. Tạo instance Axios chính
const api = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
});

// 2. Request Interceptor (Giữ nguyên)
api.interceptors.request.use(
  (config) => {
    const accessToken = store.getState().auth.accessToken;
    if (accessToken && !config.headers.Authorization) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// 3. Response Interceptor (Đã tối ưu)
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const refreshToken = store.getState().auth.refreshToken;

    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      refreshToken
    ) {
      originalRequest._retry = true;

      try {
        // ⚠️ QUAN TRỌNG: Phải dùng Full URL hoặc tạo instance mới để tránh lỗi 404
        // vì axios mặc định không biết baseURL là gì.
        const refreshRes = await axios.post(`${BASE_URL}/auth/refresh-token`, {
          refreshToken,
        });

        const newAccessToken = refreshRes.data.accessToken;

        // ✅ Cập nhật Cookie TẠI ĐÂY thay vì trong Reducer
        Cookies.set("accessToken", newAccessToken, { expires: 1 / 24 }); // 1 giờ

        // Cập nhật Redux Store
        store.dispatch(setNewAccessToken(newAccessToken));

        // Thử lại request ban đầu
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

        // Gọi lại bằng instance 'api' để giữ cấu hình interceptor
        return api(originalRequest);
      } catch (refreshError) {
        // Nếu lỗi, logout sạch sẽ
        store.dispatch(logOut());
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  }
);

export default api;
