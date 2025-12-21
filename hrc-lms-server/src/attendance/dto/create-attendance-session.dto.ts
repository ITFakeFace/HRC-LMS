import { IsInt, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateAttendanceSessionDto {
  @IsInt()
  @IsNotEmpty()
  classId: number;

  @IsInt()
  @IsNotEmpty()
  openBy: number; // Thường lấy từ JWT, nhưng trong DTO cứ validate cho chắc

  @IsString()
  @IsOptional()
  @MaxLength(10)
  code?: string;
}