// src/auth/dto/register.dto.ts
import { 
  IsNotEmpty, 
  IsString, 
  IsEmail, 
  MinLength, 
  MaxLength, 
  IsBoolean, 
  IsDateString,
  IsOptional,
  Matches
} from 'class-validator';

export class RegisterDto {
  @IsNotEmpty({ message: 'pID không được để trống.' })
  @IsString({ message: 'pID phải là chuỗi.' })
  @MaxLength(12, { message: 'pID không được vượt quá 12 ký tự.' })
  pID: string;

  @IsNotEmpty({ message: 'Username không được để trống.' })
  @IsString({ message: 'Username phải là chuỗi.' })
  @MaxLength(50, { message: 'Username không được vượt quá 50 ký tự.' })
  username: string;

  @IsOptional()
  @IsString({ message: 'Số điện thoại phải là chuỗi.' })
  @Matches(/^[0-9]{10}$/, { message: 'Số điện thoại không hợp lệ (10 chữ số).' })
  phone?: string;

  @IsNotEmpty({ message: 'Email không được để trống.' })
  @IsEmail({}, { message: 'Email không hợp lệ.' })
  @MaxLength(100, { message: 'Email không được vượt quá 100 ký tự.' })
  email: string;

  @IsNotEmpty({ message: 'Mật khẩu không được để trống.' })
  @IsString({ message: 'Mật khẩu phải là chuỗi.' })
  @MinLength(8, { message: 'Mật khẩu phải có ít nhất 8 ký tự.' })
  @MaxLength(255, { message: 'Mật khẩu không được vượt quá 255 ký tự.' })
  password: string;

  @IsNotEmpty({ message: 'Họ tên không được để trống.' })
  @IsString({ message: 'Họ tên phải là chuỗi.' })
  @MaxLength(100, { message: 'Họ tên không được vượt quá 100 ký tự.' })
  fullname: string;

  @IsBoolean({ message: 'Giới tính phải là giá trị Boolean (true/false).' })
  gender: boolean;

  @IsNotEmpty({ message: 'Ngày sinh không được để trống.' })
  @IsDateString({}, { message: 'Ngày sinh phải ở định dạng ngày tháng hợp lệ (ISO 8601).' })
  dob: string; // Sử dụng string, sau đó chuyển thành Date object khi lưu vào DB
}