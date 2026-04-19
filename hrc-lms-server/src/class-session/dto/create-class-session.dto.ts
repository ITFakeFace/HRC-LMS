import { IsInt, IsNotEmpty, IsDateString, IsString, IsOptional } from 'class-validator';
import { Type } from 'class-transformer'; // <--- Thêm cái này

export class CreateClassSessionDto {
  @IsInt()
  @IsNotEmpty()
  classId: number;

  @IsInt()
  @IsNotEmpty()
  sessionNumber: number;

  // Dùng @Type để tự động convert string '2025-12-24' thành Date Object khi vào Service
  @IsDateString()
  @IsNotEmpty()
  // @Type(() => Date) // Tùy chọn: Nếu Prisma của bạn field này là DateTime
  date: string; 

  @IsDateString()
  @IsNotEmpty()
  // @Type(() => Date) // Nên mở nếu bạn muốn dùng các hàm ngày tháng trong service luôn
  startTime: string; 

  @IsDateString()
  @IsNotEmpty()
  endTime: string; 

  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  description?: string;
}