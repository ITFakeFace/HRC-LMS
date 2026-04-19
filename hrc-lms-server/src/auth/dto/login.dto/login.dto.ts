import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class LoginDto {
  @IsNotEmpty({ message: 'Email không được để trống.' })
  @IsEmail({}, { message: 'Email không hợp lệ.' })
  @MaxLength(100, { message: 'Email không được vượt quá 100 ký tự.' })
  email: string;

  @IsNotEmpty({ message: 'Mật khẩu không được để trống.' })
  @IsString({ message: 'Mật khẩu phải là chuỗi ký tự.' })
  @MaxLength(255, { message: 'Mật khẩu không được vượt quá 255 ký tự.' })
  password: string;
}
