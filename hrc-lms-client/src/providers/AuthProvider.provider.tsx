// src/components/auth/AuthProvider.tsx
"use client";

import { useEffect, ReactNode } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/src/store/store";
import Cookies from "js-cookie";
import {
  fetchCurrentUser,
  setUnauthenticated,
} from "@/src/features/auth/authSlice"; // Kiểm tra lại đường dẫn import

export default function AuthProvider({ children }: { children: ReactNode }) {
  const dispatch = useDispatch<AppDispatch>();
  
  // Lấy cả user và status để quyết định logic
  const { user, status } = useSelector((state: RootState) => state.auth);

  useEffect(() => {
    const accessToken = Cookies.get("accessToken");

    if (accessToken) {
      // TRƯỜNG HỢP 1: CÓ TOKEN (Người dùng đã đăng nhập)
      
      // Nếu chưa có dữ liệu User (do F5 mất state, hoặc mới mở tab)
      // Bất kể status là gì (loading/idle/succeeded), nếu user null -> Phải lấy lại
      if (!user) {
         // Chỉ dispatch nếu chưa đang trong quá trình lấy (để tránh double request nếu React render 2 lần)
         // Tuy nhiên, với createAsyncThunk, Redux Toolkit thường tự deduplicate.
         // Điều kiện quan trọng nhất: Có token + Không có user.
         dispatch(fetchCurrentUser());
      }
    } else {
      // TRƯỜNG HỢP 2: KHÔNG CÓ TOKEN (Khách hoặc vừa hết hạn/xóa cookie)
      
      // Nếu Redux vẫn đang lưu thông tin User hoặc đang loading -> Cần dọn dẹp ngay
      if (user || status === "succeeded" || status === "loading") {
        dispatch(setUnauthenticated());
      }
    }
  }, [dispatch, user, status]); 
  // Dependency gồm 'user' là an toàn ở đây vì ta có check (!user) bên trong, 
  // khi user được cập nhật (khác null), effect chạy lại nhưng sẽ không lọt vào if (!user) nữa -> Không lặp.

  return <>{children}</>;
}