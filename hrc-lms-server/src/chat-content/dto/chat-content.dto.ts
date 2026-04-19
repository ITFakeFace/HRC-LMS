import { Expose, Type } from 'class-transformer';

// DTO nhỏ cho thông tin người gửi (để lồng vào ChatContent)
export class SenderDto {
  @Expose() id: number;
  @Expose() fullname: string;
  @Expose() avatar: string | null;
}

export class ChatContentDto {
  @Expose()
  id: number;

  @Expose()
  message: string;

  @Expose()
  isRead: boolean;

  @Expose()
  createdAt: Date;

  @Expose()
  sessionId: number;

  @Expose()
  senderId: number | null;

  // Field bổ sung (không có trong bảng ChatContent gốc, nhưng lấy qua relation)
  @Expose()
  @Type(() => SenderDto)
  sender?: SenderDto | null;
}
