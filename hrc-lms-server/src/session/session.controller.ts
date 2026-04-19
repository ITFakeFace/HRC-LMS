import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Put,
  UseGuards,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
  Query,
  Req,
  Patch,
} from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { ResponseModel } from 'src/response-model/model/response-model.model';
import { CreateSessionDto } from './dto/create-session.dto';
import { QuerySessionDto } from './dto/query-session.dto';
import { SessionService } from './session.service';

@Controller('sessions')
export class SessionController {
  constructor(private readonly sessionService: SessionService) {}

  // 1. CREATE (POST /sessions)
  // [Updated] DTO giờ đã hỗ trợ userId và bookingState
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() dto: CreateSessionDto): Promise<ResponseModel> {
    const res = await this.sessionService.createSession(dto);

    if (res.hasErrors()) {
      return new ResponseModel({
        status: false,
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'Không thể tạo phiên làm việc.',
        errors: res.errors,
        data: null,
      });
    }

    return new ResponseModel({
      status: true,
      statusCode: HttpStatus.CREATED,
      message: 'Tạo phiên làm việc thành công',
      data: res.session,
    });
  }

  // 2. READ ALL (GET /sessions)
  // [Updated] QuerySessionDto đã hỗ trợ lọc theo userId và isEnded
  @Get()
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async findAll(@Query() query: QuerySessionDto): Promise<ResponseModel> {
    const res = await this.sessionService.getSessions(query);

    if (res.hasErrors()) {
      return new ResponseModel({
        status: false,
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'Lỗi lấy danh sách phiên.',
        errors: res.errors,
        data: null,
      });
    }

    return new ResponseModel({
      status: true,
      statusCode: HttpStatus.OK,
      message: 'Lấy danh sách phiên thành công',
      data: {
        items: (res as any).sessions,
        total: res.total,
        page: res.page,
        limit: res.limit,
      },
    });
  }

  // 3. READ ONE (GET /sessions/:id)
  @Get(':id')
  @HttpCode(HttpStatus.OK)
  async findOne(
    @Param('id', ParseIntPipe) id: number,
    @Query('includeMessages') includeMessages?: string,
  ): Promise<ResponseModel> {
    const shouldInclude = includeMessages === 'true';
    const res = await this.sessionService.getSession(id, shouldInclude);

    if (res.hasErrors()) {
      if (res.errors.some((err) => err.key === 'id')) {
        return new ResponseModel({
          status: false,
          statusCode: HttpStatus.NOT_FOUND,
          message: `Phiên làm việc ID ${id} không tồn tại.`,
          errors: res.errors,
          data: null,
        });
      }

      return new ResponseModel({
        status: false,
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'Lỗi lấy chi tiết phiên.',
        errors: res.errors,
        data: null,
      });
    }

    return new ResponseModel({
      status: true,
      statusCode: HttpStatus.OK,
      message: 'Lấy chi tiết phiên thành công',
      data: {
        session: res.session,
        messages: (res as any).messages,
      },
    });
  }

  // 4. LINK USER (PUT /sessions/:id/link)
  @Put(':id/link')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async linkUser(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: any,
  ): Promise<ResponseModel> {
    const userId = req.user.id;
    const res = await this.sessionService.linkUserToSession(id, userId);

    if (res.hasErrors()) {
      if (res.errors.some((err) => err.key === 'id')) {
        return new ResponseModel({
          status: false,
          statusCode: HttpStatus.NOT_FOUND,
          message: `Phiên ID ${id} không tồn tại.`,
          errors: res.errors,
          data: null,
        });
      }
      // Lỗi 400 nếu session đã thuộc về người khác
      if (res.errors.some((err) => err.key === 'userId')) {
        return new ResponseModel({
          status: false,
          statusCode: HttpStatus.BAD_REQUEST,
          message: 'Phiên này đã thuộc về người dùng khác.',
          errors: res.errors,
          data: null,
        });
      }
      return new ResponseModel({
        status: false,
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'Không thể liên kết người dùng.',
        errors: res.errors,
        data: null,
      });
    }

    return new ResponseModel({
      status: true,
      statusCode: HttpStatus.OK,
      message: 'Liên kết người dùng thành công',
      data: res.session,
    });
  }

  // 5. SET AI STATUS (PATCH /sessions/:id/ai-status)
  @Patch(':id/ai-status')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async setAiStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body('enable') enable: boolean,
  ): Promise<ResponseModel> {
    const res = await this.sessionService.setAiStatus(id, enable);

    if (res.hasErrors()) {
      return new ResponseModel({
        status: false,
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'Không thể cập nhật trạng thái AI.',
        errors: res.errors,
        data: null,
      });
    }

    return new ResponseModel({
      status: true,
      statusCode: HttpStatus.OK,
      message: `Đã ${enable ? 'bật' : 'tắt'} AI cho phiên này`,
      data: res.session,
    });
  }

  // 6. [NEW] UPDATE BOOKING STATE (PATCH /sessions/:id/booking-state)
  // Dùng để reset form hoặc update thủ công từ client
  @Patch(':id/booking-state')
  @HttpCode(HttpStatus.OK)
  async updateBookingState(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: any, // Nhận toàn bộ body làm state mới
  ): Promise<ResponseModel> {
    // Nếu body rỗng hoặc có field 'reset' = true -> set state thành null
    const newState = body.reset ? null : body;

    const res = await this.sessionService.updateBookingState(id, newState);

    if (res.hasErrors()) {
      return new ResponseModel({
        status: false,
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'Không thể cập nhật trạng thái đặt lịch.',
        errors: res.errors,
        data: null,
      });
    }

    return new ResponseModel({
      status: true,
      statusCode: HttpStatus.OK,
      message: 'Cập nhật trạng thái đặt lịch thành công',
      data: res.session,
    });
  }

  // 7. END SESSION (PUT /sessions/:id/end)
  @Put(':id/end')
  @HttpCode(HttpStatus.OK)
  async endSession(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<ResponseModel> {
    const res = await this.sessionService.endSession(id);

    if (res.hasErrors()) {
      return new ResponseModel({
        status: false,
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'Không thể kết thúc phiên.',
        errors: res.errors,
        data: null,
      });
    }

    return new ResponseModel({
      status: true,
      statusCode: HttpStatus.OK,
      message: 'Phiên làm việc đã kết thúc',
      data: res.session,
    });
  }

  // 8. DELETE (DELETE /sessions/:id)
  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async delete(@Param('id', ParseIntPipe) id: number): Promise<ResponseModel> {
    const res = await this.sessionService.deleteSession(id);

    if (res.hasErrors()) {
      if (res.errors.some((err) => err.key === 'id')) {
        return new ResponseModel({
          status: false,
          statusCode: HttpStatus.NOT_FOUND,
          message: `Phiên ID ${id} không tồn tại.`,
          errors: res.errors,
          data: null,
        });
      }
      return new ResponseModel({
        status: false,
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'Không thể xóa phiên.',
        errors: res.errors,
        data: null,
      });
    }

    return new ResponseModel({
      status: true,
      statusCode: HttpStatus.OK,
      message: 'Xóa phiên thành công',
      data: null,
    });
  }
}
