// src/hooks/useSocket.ts
import { useEffect, useState, useRef } from "react";
import { io, Socket } from "socket.io-client";

const SOCKET_URL = "http://localhost:8080"; // Đổi thành URL server của bạn

// Thêm | null vào kiểu dữ liệu vì lúc đầu chưa có session
export const useSocket = (sessionId: number | null) => {
  const [socket, setSocket] = useState<Socket | null>(null);

  // Dùng ref để giữ instance nếu cần, nhưng state là đủ cho việc render
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    // 1. CHẶN: Nếu chưa có sessionId (đang loading hoặc chưa tạo xong) thì KHÔNG kết nối
    if (!sessionId) {
      return;
    }

    // 2. Khởi tạo kết nối
    console.log("🔌 Đang kết nối Socket với Session:", sessionId);

    const socketInstance = io(SOCKET_URL, {
      // Gửi sessionId lên Server qua Query String
      // Server sẽ nhận được tại: client.handshake.query.sessionId
      query: {
        sessionId: String(sessionId),
      },
      transports: ["websocket"],
    });

    socketInstance.on("connect", () => {
      console.log("✅ Đã kết nối Socket ID:", socketInstance.id);
    });

    socketInstance.on("disconnect", () => {
      console.log("❌ Socket ngắt kết nối");
    });

    setSocket(socketInstance);
    socketRef.current = socketInstance;

    // 3. Cleanup: Ngắt kết nối khi component unmount hoặc sessionId thay đổi
    return () => {
      if (socketInstance.connected) {
        socketInstance.disconnect();
      }
    };
  }, [sessionId]); // <--- Dependency quan trọng: Chạy lại khi sessionId thay đổi

  return socket;
};
