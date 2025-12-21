import { IsEmail, IsNotEmpty, IsString, IsOptional } from 'class-validator';

export class SendEmailDto {
  @IsEmail({}, { message: 'Địa chỉ email không hợp lệ.' })
  @IsNotEmpty({ message: 'Email người nhận là bắt buộc.' })
  to: string;

  @IsString()
  @IsNotEmpty({ message: 'Tiêu đề email là bắt buộc.' })
  title: string;

  @IsString()
  @IsNotEmpty({ message: 'Nội dung email là bắt buộc.' })
  body: string;
}