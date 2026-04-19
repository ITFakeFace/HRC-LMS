import { Transform, Type } from 'class-transformer';
import { IsBoolean, IsInt, IsOptional, Min } from 'class-validator';

export class QuerySessionDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit: number = 10;

  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  @IsBoolean()
  includeMessages?: boolean = false;

  // [NEW] Lọc theo User (Dành cho Admin xem lịch sử user cụ thể)
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  userId?: number;

  // [NEW] Lọc theo trạng thái kết thúc (Active vs Ended)
  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  @IsBoolean()
  isEnded?: boolean;
}
