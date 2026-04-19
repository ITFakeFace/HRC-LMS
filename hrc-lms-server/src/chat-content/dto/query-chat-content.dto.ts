import { Type } from 'class-transformer';
import { IsInt, IsOptional, Min } from 'class-validator';

export class QueryChatContentDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  sessionId?: number; // Lọc tin nhắn của session cụ thể

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 20; // Mặc định lấy 20 tin nhắn mỗi lần
}
