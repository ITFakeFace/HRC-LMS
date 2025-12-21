import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  UsePipes,
  ValidationPipe,
  UseGuards,
} from '@nestjs/common';
import { EmailService } from './email.service';
import { SendEmailDto } from './dto/send-email.dto';
import { ResponseModel } from 'src/response-model/model/response-model.model';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard'; // Tùy chọn: Nếu muốn bảo mật API này

@Controller('email')
// @UseGuards(JwtAuthGuard) // Bỏ comment dòng này nếu bạn muốn chỉ user đã login mới được gửi mail
export class EmailController {
  constructor(private readonly emailService: EmailService) {}

  // POST /email/send
  @Post('send')
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ValidationPipe())
  async sendEmail(@Body() sendEmailDto: SendEmailDto): Promise<ResponseModel> {
    try {
      const result = await this.emailService.sendEmail(
        sendEmailDto.to,
        sendEmailDto.title,
        sendEmailDto.body,
      );

      if (result) {
        return new ResponseModel({
          status: true,
          statusCode: HttpStatus.OK,
          message: 'Email sent successfully.',
          data: null,
        });
      } else {
        // Trường hợp service trả về false (nếu logic service có return false)
        return new ResponseModel({
          status: false,
          statusCode: HttpStatus.BAD_REQUEST,
          message: 'Failed to send email.',
          errors: [{ key: 'global', value: ['Email service returned failure.'] }],
          data: null,
        });
      }
    } catch (error) {
      console.error('Email Controller Error:', error);
      
      return new ResponseModel({
        status: false,
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR, // 500
        message: 'Internal Server Error while sending email.',
        errors: [{ key: 'service', value: [error.message] }],
        data: null,
      });
    }
  }
}