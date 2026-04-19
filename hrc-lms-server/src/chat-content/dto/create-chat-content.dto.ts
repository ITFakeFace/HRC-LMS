import { PartialType } from '@nestjs/mapped-types';
import {
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class CreateChatContentDto {
  @IsString({ message: 'Tin nhắn phải là chuỗi ký tự' })
  @IsNotEmpty({ message: 'Nội dung tin nhắn không được để trống' })
  @MaxLength(255, { message: 'Tin nhắn không được quá 255 ký tự' })
  message: string;

  @IsInt()
  sessionId: number;

  // SenderId là Optional vì:
  // 1. Nếu là User gửi: Server tự lấy từ Token (Req.user.id)
  // 2. Nếu là Bot gửi: Server có thể để null hoặc ID của Bot
  @IsOptional()
  @IsInt()
  senderId?: number | null;

  @IsOptional()
  @IsString()
  forcedIntent?: 'tư vấn' | 'đặt lịch';
}

// Kế thừa từ Create, nhưng tất cả đều là Optional
export class UpdateChatContentDto extends PartialType(CreateChatContentDto) {
  @IsOptional()
  @IsBoolean()
  isRead?: boolean; // Dùng để đánh dấu đã đọc
}
