import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
} from '@nestjs/common';
import { ResponseFormatter } from 'src/utils/response-formater.util';

@Controller('system/templates')
export class TemplateController {
  constructor(private readonly responseFormatter: ResponseFormatter) {}

  // 1. Lấy tất cả các mẫu
  @Get()
  getAll() {
    return this.responseFormatter.getAllVariants();
  }

  // 2. Thêm mẫu mới (Ví dụ: Thêm style "Gen Z" cho Booking)
  @Post(':category')
  create(@Param('category') category: string, @Body() body: any) {
    return this.responseFormatter.addVariant(category as any, body);
  }

  // 3. Sửa mẫu
  @Put(':category/:id')
  update(
    @Param('category') category: string,
    @Param('id') id: string,
    @Body() body: any,
  ) {
    return this.responseFormatter.updateVariant(category as any, id, body);
  }

  // 4. Xóa mẫu
  @Delete(':category/:id')
  delete(@Param('category') category: string, @Param('id') id: string) {
    return this.responseFormatter.deleteVariant(category as any, id);
  }
}
