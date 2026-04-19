"use client";
import React, { useState, useRef, useEffect } from "react";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { Avatar } from "primereact/avatar";
import { useClientSession } from "@/src/hooks/useClientSession.hook";
import { useAuth } from "@/src/hooks/useAuth";
import { useSocket } from "@/src/hooks/useSocket.hook";
import api from "@/src/api/api";

// --- INTERFACES ---
interface BackendMessage {
  id: number;
  message: string;
  senderId: number | null;
  createdAt: string;
}

interface UIMessage {
  id: string;
  text: string;
  type: "me" | "bot";
  timestamp: Date;
  isError?: boolean;
}

const ChatSupportWidget: React.FC = () => {
  // --- HOOKS ---
  const { user } = useAuth();
  const { sessionId } = useClientSession(user);
  const socket = useSocket(sessionId);

  // --- STATES ---
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<UIMessage[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [loadingHistory, setLoadingHistory] = useState(false);

  // State Typing & Status
  const [isTyping, setIsTyping] = useState(false);
  const [typingStatus, setTypingStatus] = useState<string | null>(null);

  // 🆕 STATE: Full Screen Mode
  const [isFullScreen, setIsFullScreen] = useState(false);

  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const hasFetchedHistory = useRef(false);

  // --- 1. LOGIC MAPPING ---
  const mapMsgToUi = (msg: BackendMessage): UIMessage => {
    let type: "me" | "bot" = "bot";

    if (user?.id) {
      if (msg.senderId === user.id) type = "me";
    } else {
      if (msg.senderId === null) type = "me";
    }

    return {
      id: msg.id.toString(),
      text: msg.message,
      type: type,
      timestamp: new Date(msg.createdAt),
      isError: false,
    };
  };

  // --- 2. AUTO SCROLL ---
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) scrollToBottom();
  }, [messages, isOpen, isTyping, isFullScreen]); // Scroll khi resize

  // --- 3. FETCH HISTORY ---
  useEffect(() => {
    const fetchHistory = async () => {
      if (!sessionId) return;

      setLoadingHistory(true);
      try {
        const res = await api.get(`/chat-contents`, {
          params: { sessionId, limit: 50 },
        });

        if (res.data.status) {
          const historyItems: BackendMessage[] = res.data.data.items;
          const uiMessages = historyItems.reverse().map(mapMsgToUi);
          setMessages(uiMessages);
        }
      } catch (error) {
        console.error("Lỗi tải lịch sử chat:", error);
      } finally {
        setLoadingHistory(false);
      }
    };

    if (isOpen && sessionId && !hasFetchedHistory.current) {
      fetchHistory();
      hasFetchedHistory.current = true;
    }
  }, [sessionId, isOpen, user?.id]);

  // --- HELPER: THÊM TIN NHẮN LỖI ---
  const addErrorMessage = (text: string) => {
    const errorMsg: UIMessage = {
      id: `err-${Date.now()}`,
      text: text,
      type: "bot",
      timestamp: new Date(),
      isError: true,
    };
    setMessages((prev) => [...prev, errorMsg]);
  };

  // --- 4. SOCKET LISTENER ---
  useEffect(() => {
    if (!socket) return;

    const handleReceiveMessage = (newMsg: BackendMessage) => {
      setTypingStatus(null);
      setMessages((prev) => {
        if (prev.some((m) => m.id === newMsg.id.toString())) return prev;
        return [...prev, mapMsgToUi(newMsg)];
      });
    };

    const handleBotStatus = (data: { isTyping: boolean; message: string }) => {
      if (data.isTyping) {
        setTypingStatus(data.message);
        scrollToBottom();
      } else {
        setTypingStatus(null);
      }
    };

    const handleConnectError = (err: any) => {
      setIsTyping(false);
      console.error("Socket connect error:", err);
      if (isTyping) {
        addErrorMessage("Mất kết nối máy chủ.");
      }
    };

    const handleServerError = (err: any) => {
      setIsTyping(false);
      console.error("Server error:", err);
      const msg = err?.message || "Có lỗi xảy ra từ phía máy chủ.";
      addErrorMessage(`Lỗi: ${msg}`);
    };

    socket.on("receive_message", handleReceiveMessage);
    socket.on("bot_status", handleBotStatus);
    socket.on("connect_error", handleConnectError);
    socket.on("exception", handleServerError);
    socket.on("error", handleServerError);

    return () => {
      socket.off("receive_message", handleReceiveMessage);
      socket.off("bot_status", handleBotStatus);
      socket.off("connect_error", handleConnectError);
      socket.off("exception", handleServerError);
      socket.off("error", handleServerError);
    };
  }, [socket, user?.id, isTyping]);

  // --- 5. SEND MESSAGE ---
  const handleSendMessage = () => {
    if (!inputMessage.trim()) return;

    if (!socket || !socket.connected || !sessionId) {
      addErrorMessage("Gửi thất bại: Không có kết nối mạng ❌");
      return;
    }

    socket.emit("send_message", {
      message: inputMessage,
      sessionId: sessionId,
      senderId: user?.id || null,
    });

    setInputMessage("");
    setIsTyping(true);
    setTypingStatus("HRC Bot đang nhập...");
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") handleSendMessage();
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // --- RENDER ---
  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end font-sans">
      {/* --- KHUNG CHAT --- */}
      {isOpen && (
        <div
          // 🆕 UPDATE STYLE: Logic chuyển đổi giữa Normal và Full Screen
          className={`bg-white flex flex-col overflow-hidden transition-all duration-300 ease-in-out
            ${
              isFullScreen
                ? "fixed inset-0 w-full h-full z-[9999] rounded-none m-0" // Style Full Screen
                : "mb-4 w-96 h-[500px] rounded-lg shadow-2xl border border-gray-200 animate-fadeIn" // Style Normal
            }
          `}
        >
          {/* HEADER */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white p-4 flex items-center justify-between shadow-md shrink-0">
            <div className="flex items-center gap-3">
              <div className="relative">
                <Avatar
                  icon="pi pi-android"
                  className="bg-white text-blue-600"
                  shape="circle"
                />
                {socket?.connected && (
                  <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 border-2 border-white rounded-full"></span>
                )}
              </div>
              <div>
                <h3 className="font-bold text-md">HRC Assistant</h3>
                <p className="text-xs text-blue-100 opacity-90">
                  {socket?.connected ? "Sẵn sàng hỗ trợ" : "Đang kết nối..."}
                </p>
              </div>
            </div>

            {/* ACTION BUTTONS */}
            <div className="flex gap-1">
              {/* 🆕 BUTTON TOGGLE FULL SCREEN */}
              <Button
                icon={
                  isFullScreen
                    ? "pi pi-window-minimize"
                    : "pi pi-window-maximize"
                }
                className="p-button-text p-button-rounded text-white hover:bg-white/20 w-8 h-8"
                onClick={() => setIsFullScreen(!isFullScreen)}
                tooltip={isFullScreen ? "Thu nhỏ" : "Phóng to"}
                tooltipOptions={{ position: "bottom" }}
              />

              {/* BUTTON CLOSE */}
              <Button
                icon="pi pi-times"
                className="p-button-text p-button-rounded text-white hover:bg-white/20 w-8 h-8"
                onClick={() => {
                  setIsOpen(false);
                  setIsFullScreen(false); // Reset về nhỏ khi đóng
                }}
              />
            </div>
          </div>

          {/* MESSAGE LIST */}
          <div className="flex-1 bg-gray-50 p-4 overflow-y-auto scroll-smooth">
            {loadingHistory && (
              <div className="flex justify-center py-4">
                <i className="pi pi-spin pi-spinner text-blue-500 text-xl"></i>
              </div>
            )}

            {!loadingHistory && messages.length === 0 && (
              <div className="text-center text-gray-400 mt-10 text-sm">
                Xin chào! Bạn cần hỗ trợ gì không? 👋
              </div>
            )}

            {messages.map((message) => {
              const isMe = message.type === "me";
              const isError = message.isError;

              return (
                <div
                  key={message.id}
                  className={`mb-3 flex ${
                    isMe ? "justify-end" : "justify-start"
                  }`}
                >
                  {!isMe && (
                    <Avatar
                      icon={
                        isError ? "pi pi-exclamation-triangle" : "pi pi-android"
                      }
                      className={`mr-2 w-8 h-8 bg-white border shadow-sm shrink-0 ${
                        isError
                          ? "text-red-500 border-red-200"
                          : "text-indigo-600 border-indigo-100"
                      }`}
                      shape="circle"
                    />
                  )}

                  <div className="max-w-[85%] md:max-w-[70%] flex flex-col">
                    {!isMe && (
                      <span className="text-[10px] text-gray-500 ml-2 mb-1 font-medium">
                        {isError ? "System" : "HRC Bot"}
                      </span>
                    )}

                    <div
                      className={`rounded-2xl px-4 py-2 shadow-sm text-sm break-words whitespace-pre-wrap ${
                        isMe
                          ? "bg-blue-600 text-white rounded-br-none"
                          : isError
                          ? "bg-red-50 text-red-600 border border-red-200 rounded-bl-none"
                          : "bg-white text-gray-800 border border-gray-200 rounded-bl-none"
                      }`}
                    >
                      {message.text}
                    </div>

                    <span
                      className={`text-[10px] mt-1 text-gray-400 ${
                        isMe ? "text-right mr-1" : "ml-1"
                      }`}
                    >
                      {formatTime(message.timestamp)}
                    </span>
                  </div>
                </div>
              );
            })}

            {typingStatus && (
              <div className="mb-3 flex justify-start animate-fadeIn">
                <Avatar
                  icon="pi pi-android"
                  className="mr-2 w-8 h-8 bg-white text-indigo-600 border border-indigo-100 shadow-sm shrink-0"
                  shape="circle"
                />
                <div className="flex flex-col">
                  <span className="text-[10px] text-gray-500 ml-2 mb-1 font-medium flex items-center gap-1">
                    HRC Bot
                    <span className="text-blue-500 animate-pulse">
                      • {typingStatus}
                    </span>
                  </span>

                  <div className="bg-white border border-gray-200 rounded-2xl rounded-bl-none px-4 py-3 shadow-sm w-fit">
                    <div className="flex space-x-1 h-3 items-center">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* INPUT AREA */}
          <div className="p-3 bg-white border-t border-gray-200 shrink-0">
            <div className="flex gap-2 items-center">
              <InputText
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder={
                  socket?.connected ? "Nhập tin nhắn..." : "Đang kết nối..."
                }
                className="flex-1 p-inputtext-sm rounded-full px-4 border-gray-300 focus:border-blue-500"
                disabled={!socket?.connected}
              />
              <Button
                icon="pi pi-send"
                onClick={handleSendMessage}
                className="p-button-rounded bg-blue-600 border-blue-600 hover:bg-blue-700 w-10 h-10 flex items-center justify-center shadow-md"
                disabled={!inputMessage.trim()}
              />
            </div>
          </div>
        </div>
      )}

      {/* FLOATING BUTTON (Chỉ hiện khi Chat đóng hoặc Chat mở nhưng ở chế độ thu nhỏ) */}
      {/* Logic: Nếu Chat mở mà Fullscreen thì ẩn nút này đi vì Chat đã đè lên rồi */}
      {(!isOpen || !isFullScreen) && (
        <Button
          icon={isOpen ? "pi pi-chevron-down" : "pi pi-comments"}
          className={`p-button-rounded shadow-2xl transition-all duration-300 z-50 flex items-center justify-center ${
            isOpen
              ? "bg-gray-600 border-gray-600 hover:bg-gray-700 w-12 h-12"
              : "bg-blue-600 border-blue-600 hover:bg-blue-700 w-14 h-14 animate-bounce-slow"
          }`}
          onClick={() => setIsOpen(!isOpen)}
        />
      )}

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(20px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out forwards;
        }
        @keyframes bounce-slow {
          0%,
          100% {
            transform: translateY(-5%);
          }
          50% {
            transform: translateY(0);
          }
        }
        .animate-bounce-slow {
          animation: bounce-slow 2s infinite;
        }
      `}</style>
    </div>
  );
};

export default ChatSupportWidget;
