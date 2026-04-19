import { Controller, Get, Query, HttpCode, HttpStatus } from '@nestjs/common';
import { ChatContentService } from './chat-content.service';
import { QueryChatContentDto } from './dto/query-chat-content.dto';
import { ResponseModel } from 'src/response-model/model/response-model.model';

@Controller('chat-contents')
export class ChatContentController {
  constructor(private readonly chatContentService: ChatContentService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  async getMessages(
    @Query() query: QueryChatContentDto,
  ): Promise<ResponseModel> {
    try {
      const data = await this.chatContentService.getHistory(query);

      return new ResponseModel({
        status: true,
        statusCode: HttpStatus.OK,
        message: 'Lấy lịch sử tin nhắn thành công',
        data: {
          items: data.items,
          total: data.total,
          page: query.page || 1,
          limit: query.limit || 20,
        },
      });
    } catch (error) {
      return new ResponseModel({
        status: false,
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'Lỗi khi lấy tin nhắn',
        data: null,
      });
    }
  }
}
