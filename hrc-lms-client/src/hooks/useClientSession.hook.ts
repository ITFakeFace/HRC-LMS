"use client";
import { useEffect, useState, useRef } from "react";
import api from "../api/api";
import { User } from "../models/users/User.model";

export const useClientSession = (user?: User | null) => {
  const [sessionId, setSessionId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const isInitializing = useRef(false);
  const hasLinkedRef = useRef(false);

  // --- CASE 1: KHỞI TẠO (Chạy 1 lần) ---
  useEffect(() => {
    const establishSession = async () => {
      if (isInitializing.current) return;
      isInitializing.current = true;

      const storageKey = "sessionId";
      let sId = sessionStorage.getItem(storageKey);

      try {
        if (sId) {
          // --- KIỂM TRA SESSION CŨ ---
          try {
            const res = await api.get(`/sessions/${sId}`);
            const sessionData = res.data.data;
            const svSession = sessionData?.session;

            if (svSession && !svSession.isEnded) {
              // 🔥 TỐI ƯU THEO Ý BẠN: Kiểm tra xung đột ngay tại đây nếu User đã có
              if (user && user.id) {
                // 1. Nếu Session này thuộc về người khác -> XÓA NGAY
                if (svSession.userId && svSession.userId !== user.id) {
                  console.warn(
                    "⚠️ Phát hiện Session của người khác ngay lúc init. Reset."
                  );
                  sessionStorage.removeItem(storageKey);
                  // Gọi đệ quy hoặc reload để tạo mới (ở đây chọn reload cho sạch)
                  window.location.reload();
                  return;
                }

                // 2. Nếu Session đúng là của mình (hoặc đã link rồi)
                if (svSession.userId === user.id) {
                  hasLinkedRef.current = true; // Đánh dấu đã link
                }
              }

              console.log("✅ Khôi phục session:", sId);
              setSessionId(Number(sId));
              setIsLoading(false);
              return;
            } else {
              // Session cũ hỏng/hết hạn
              sessionStorage.removeItem(storageKey);
            }
          } catch (err) {
            sessionStorage.removeItem(storageKey);
          }
        }

        // --- TẠO SESSION MỚI ---
        console.log("🆕 Khởi tạo session mới...");
        const payload: any = { AIEnable: true };

        // Gửi luôn UserID nếu đã có (tránh phải gọi API link sau này)
        if (user && user.id) {
          payload.userId = user.id;
        }

        const res = await api.post("/sessions", payload);

        if (res.data.status) {
          const newId = res.data.data.id;
          sessionStorage.setItem(storageKey, String(newId));
          setSessionId(newId);

          if (user && user.id) {
            hasLinkedRef.current = true;
          }
        }
      } catch (error) {
        console.error("🔥 Lỗi khởi tạo session:", error);
      } finally {
        setIsLoading(false);
      }
    };

    establishSession();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Vẫn để rỗng để chỉ chạy 1 lần mount

  // --- CASE 2: Xử lý REACTIVITY (Khi User đăng nhập muộn) ---
  // Vẫn cần giữ cái này vì user có thể thay đổi từ null -> object sau khi mount
  useEffect(() => {
    const linkUserToSession = async () => {
      if (sessionId && user && user.id && !hasLinkedRef.current) {
        try {
          // Kiểm tra lại lần nữa (đề phòng) trước khi gọi API Link
          // Vì API Link sẽ throw lỗi nếu session thuộc về người khác
          // Nhưng gọi API Link luôn cũng là một cách check chuẩn xác nhất
          await api.put(`/sessions/${sessionId}/link`);
          console.log("✅ Auto-Link User thành công!");
          hasLinkedRef.current = true;
        } catch (error: any) {
          // Logic bắt lỗi 400 (Conflict) như cũ
          if (error.response && error.response.status === 400) {
            console.warn("⚠️ Session Conflict (Late check). Reloading...");
            sessionStorage.removeItem("sessionId");
            window.location.reload();
          }
        }
      }
    };
    linkUserToSession();
  }, [sessionId, user]); // Chạy khi user thay đổi

  return { sessionId, isLoading };
};
