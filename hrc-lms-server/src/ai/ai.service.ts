import { HttpService } from '@nestjs/axios';
import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { firstValueFrom } from 'rxjs';

// 1. Định nghĩa kiểu dữ liệu khớp với Python (StandardResponse)
export interface ChatRequestPayload {
  question: string;
  booking_state?: any;
  forced_intent?: 'tư vấn' | 'đặt lịch' | null;
}

export interface ChatRequestPayload {
  question: string;
  booking_state?: any; // State đặt lịch hiện tại (nếu có)
}

@Injectable()
export class AiService {
  // URL của Python Server (nên để vào biến môi trường .env)
  private readonly AI_API_URL =
    process.env.AI_API_URL || 'http://127.0.0.1:8000/chat';

  constructor(private readonly httpService: HttpService) {}

  /**
   * Hàm gọi sang Python để hỏi
   */
  async ask(
    question: string,
    currentBookingState?: any,
    forcedIntent?: 'tư vấn' | 'đặt lịch', // <--- THÊM THAM SỐ
  ): Promise<any> {
    try {
      const payload: ChatRequestPayload = {
        question: question,
        booking_state: currentBookingState || null,
        forced_intent: forcedIntent || null, // <--- GỬI ĐI
      };

      const { data } = await firstValueFrom(
        this.httpService.post(this.AI_API_URL, payload),
      );

      return data;
    } catch (error) {
      console.error('❌ Lỗi AI Service:', error.message);
      return { target: null, data: null };
    }
  }
}
