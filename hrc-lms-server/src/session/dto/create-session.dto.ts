import { IsBoolean, IsOptional, IsInt, IsObject } from 'class-validator';

export class CreateSessionDto {
  @IsOptional()
  @IsBoolean({ message: 'AIEnable phải là giá trị boolean' })
  AIEnable?: boolean;

  @IsOptional()
  @IsBoolean()
  isEnded?: boolean;

  @IsOptional()
  @IsInt()
  userId?: number;

  // [NEW] Trường lưu trạng thái đặt lịch (JSON)
  // Dùng IsOptional vì khi tạo mới session thường chưa có state
  @IsOptional()
  bookingState?: any;
}
