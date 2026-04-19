import { Module, Global } from '@nestjs/common';
import { ResponseFormatter } from './response-formater.util';
// import { TemplateController } from './template.controller'; // (Nếu bạn có làm controller CRUD)

@Global() // 👈 Mẹo: Dùng @Global để không phải import lại module này ở khắp nơi
@Module({
  controllers: [], // Thêm TemplateController vào đây nếu bạn đã tạo API quản lý
  providers: [ResponseFormatter],
  exports: [ResponseFormatter], // 👈 QUAN TRỌNG: Phải export thì module khác mới dùng được
})
export class ResponseFormatterModule {}
