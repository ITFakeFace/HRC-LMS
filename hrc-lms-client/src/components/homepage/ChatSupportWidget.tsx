"use client"
import React, { useState, useRef, useEffect } from 'react';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { Avatar } from 'primereact/avatar';
import { ScrollPanel } from 'primereact/scrollpanel';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
}

const ChatSupportWidget: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: 'Xin chào! Tôi có thể giúp gì cho bạn hôm nay?',
      sender: 'bot',
      timestamp: new Date(),
    },
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const simulateApiResponse = (userMessage: string): string => {
    const responses = [
      'Cảm ơn bạn đã liên hệ! Tôi đang xem xét câu hỏi của bạn.',
      'Đây là một câu hỏi hay! Để tôi giúp bạn tìm hiểu thêm.',
      'Tôi hiểu vấn đề của bạn. Cho phép tôi hỗ trợ bạn ngay.',
      'Bạn có thể cung cấp thêm thông tin để tôi hỗ trợ tốt hơn không?',
      'Dựa trên câu hỏi của bạn, tôi nghĩ giải pháp tốt nhất là...',
    ];

    if (userMessage.toLowerCase().includes('giá')) {
      return 'Về vấn đề giá cả, chúng tôi có nhiều gói dịch vụ phù hợp với nhu cầu của bạn. Bạn muốn tìm hiểu về gói nào?';
    }
    if (userMessage.toLowerCase().includes('hỗ trợ') || userMessage.toLowerCase().includes('giúp')) {
      return 'Tôi luôn sẵn sàng hỗ trợ bạn! Vui lòng cho tôi biết bạn cần trợ giúp về vấn đề gì?';
    }
    if (userMessage.toLowerCase().includes('cảm ơn')) {
      return 'Rất vui được giúp đỡ bạn! Nếu có thắc mắc gì khác, đừng ngần ngại nhé! 😊';
    }

    return responses[Math.floor(Math.random() * responses.length)];
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputMessage,
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputMessage('');
    setIsTyping(true);

    // Giả lập API call với delay
    setTimeout(() => {
      const botResponse: Message = {
        id: (Date.now() + 1).toString(),
        text: simulateApiResponse(inputMessage),
        sender: 'bot',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, botResponse]);
      setIsTyping(false);
    }, 1000 + Math.random() * 1000);
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSendMessage();
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      {/* Chat Box */}
      {isOpen && (
        <div className="mb-4 w-96 bg-white rounded-lg shadow-2xl border border-gray-200 animate-fadeIn">
          {/* Header */}
          <div className="bg-linear-to-r from-blue-600 to-blue-700 text-white p-4 rounded-t-lg flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Avatar
                icon="pi pi-user"
                className="bg-white text-blue-600"
                shape="circle"
              />
              <div>
                <h3 className="font-semibold text-lg">Hỗ Trợ Trực Tuyến</h3>
                <p className="text-xs text-blue-100">Đang hoạt động</p>
              </div>
            </div>
            <Button
              icon="pi pi-times"
              className="p-button-text p-button-rounded text-white hover:bg-white/20"
              onClick={() => setIsOpen(false)}
            />
          </div>

          {/* Messages */}
          <div className="h-96 bg-gray-50 p-4 overflow-y-auto">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`mb-4 flex ${
                  message.sender === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                <div
                  className={`max-w-[75%] ${
                    message.sender === 'user'
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-gray-800 border border-gray-200'
                  } rounded-2xl px-4 py-2 shadow-sm`}
                >
                  <p className="text-sm">{message.text}</p>
                  <p
                    className={`text-xs mt-1 ${
                      message.sender === 'user'
                        ? 'text-blue-100'
                        : 'text-gray-500'
                    }`}
                  >
                    {formatTime(message.timestamp)}
                  </p>
                </div>
              </div>
            ))}

            {isTyping && (
              <div className="flex justify-start mb-4">
                <div className="bg-white border border-gray-200 rounded-2xl px-4 py-3 shadow-sm">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></span>
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100"></span>
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200"></span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-4 bg-white border-t border-gray-200 rounded-b-lg">
            <div className="flex gap-2">
              <InputText
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Nhập tin nhắn..."
                className="flex-1 text-sm"
              />
              <Button
                icon="pi pi-send"
                onClick={handleSendMessage}
                className="bg-blue-600 hover:bg-blue-700 border-blue-600"
                disabled={!inputMessage.trim()}
              />
            </div>
          </div>
        </div>
      )}

      {/* Floating Button */}
      <Button
        icon={isOpen ? 'pi pi-times' : 'pi pi-comment'}
        className={`p-button-rounded p-button-lg shadow-2xl transition-all duration-300 ${
          isOpen
            ? 'bg-gray-600 hover:bg-gray-700 border-gray-600'
            : 'bg-blue-600 hover:bg-blue-700 border-blue-600'
        }`}
        onClick={() => setIsOpen(!isOpen)}
        style={{ width: '60px', height: '60px' }}
      />

      {/* Unread Badge (optional) */}
      {!isOpen && (
        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center animate-pulse">
          1
        </span>
      )}

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }

        .delay-100 {
          animation-delay: 0.1s;
        }

        .delay-200 {
          animation-delay: 0.2s;
        }
      `}</style>
    </div>
  );
};

export default ChatSupportWidget;