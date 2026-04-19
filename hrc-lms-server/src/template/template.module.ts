import { Module } from '@nestjs/common';
import { TemplateController } from './template.controller';
// Lưu ý: Import đúng đường dẫn file response-formatter.util.ts của bạn
import { ResponseFormatter } from 'src/utils/response-formater.util';

@Module({
  imports: [],
  controllers: [TemplateController],
  providers: [
    ResponseFormatter, // Đăng ký Service này làm Provider của module
  ],
  exports: [
    ResponseFormatter, // QUAN TRỌNG: Export để ChatModule có thể import và sử dụng
  ],
})
export class TemplateModule {}
