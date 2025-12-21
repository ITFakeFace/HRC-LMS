import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';

@Injectable()
export class EmailService {
  constructor(private readonly mailerService: MailerService) {}

  /**
   * Gửi Email
   * @param to - Địa chỉ người nhận
   * @param title - Tiêu đề email (Subject)
   * @param body - Nội dung (có thể là HTML string hoặc Plain text)
   */
  async sendEmail(to: string, title: string, body: string): Promise<boolean> {
    try {
      await this.mailerService.sendMail({
        to: to,
        subject: title,
        // Cách xử lý thông minh:
        // Gán body vào html property. Nếu body chỉ là text thường, nó vẫn hiển thị tốt.
        // Nếu body là <h1>Hello</h1>, nó sẽ render HTML.
        html: body, 
        
        // (Optional) Tự động tạo bản text-only từ HTML để tránh bị Spam filter
        // text: body, 
      });

      console.log(`Mail sent to ${to} successfully`);
      return true;
    } catch (error) {
      console.error('Error sending email:', error);
      // Tùy chọn: Throw lỗi để Controller bắt hoặc return false
      throw new InternalServerErrorException('Gửi email thất bại');
    }
  }
}