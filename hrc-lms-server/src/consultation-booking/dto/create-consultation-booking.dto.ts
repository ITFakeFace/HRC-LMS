import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEmail,
  IsDateString,
  MaxLength,
} from 'class-validator';

export class CreateConsultationBookingDto {
  @IsString()
  @IsNotEmpty({ message: 'Họ tên không được để trống' })
  @MaxLength(255)
  fullname: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  phone?: string;

  @IsOptional()
  @IsEmail({}, { message: 'Email không hợp lệ' })
  @MaxLength(255)
  email?: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  method: string;

  // Input nhận vào là String chuẩn ISO-8601 (VD: "2026-01-02T19:00:00.000Z")
  @IsDateString({}, { message: 'Thời gian không đúng định dạng' })
  @IsNotEmpty()
  time: string;

  @IsOptional()
  @IsString()
  destination?: string;
}
