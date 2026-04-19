import { Injectable } from '@nestjs/common';
import { SessionRepository } from './session.repository';
import { CreateSessionDto } from './dto/create-session.dto';
import { QuerySessionDto } from './dto/query-session.dto';
import { ResponseSessionDto } from './dto/response-session.dto';
import { SessionDto } from './dto/session.dto';
import { ClientSession, Prisma } from '@prisma/client';

@Injectable()
export class SessionService {
  constructor(private readonly repository: SessionRepository) {}

  // 1. CẬP NHẬT MAPPER: Thêm bookingState
  private mapToSessionDto(model: ClientSession): SessionDto {
    return {
      id: model.id,
      AIEnable: model.AIEnable,
      isEnded: model.isEnded,
      userId: model.userId,
      bookingState: model.bookingState, // <--- Thêm dòng này
      createdAt: model.createdAt,
      updatedAt: model.updatedAt,
    };
  }

  // 2. CREATE SESSION
  async createSession(dto: CreateSessionDto): Promise<ResponseSessionDto> {
    const res = new ResponseSessionDto();
    try {
      const createData: Prisma.ClientSessionCreateInput = {
        AIEnable: dto.AIEnable ?? true,
        isEnded: dto.isEnded ?? false,
        // Nếu có userId thì connect, không thì thôi
        ...(dto.userId && { user: { connect: { id: dto.userId } } }),
        // Nếu có bookingState ban đầu
        ...(dto.bookingState && { bookingState: dto.bookingState }),
      };

      const newSession = await this.repository.create(createData);
      res.session = this.mapToSessionDto(newSession);
    } catch (error) {
      console.error(error);
      res.pushError({ key: 'create', value: 'Lỗi khi tạo phiên làm việc' });
    }
    return res;
  }

  // 3. GET ONE SESSION
  async getSession(
    id: number,
    includeMessages = false,
  ): Promise<ResponseSessionDto> {
    const res = new ResponseSessionDto();
    try {
      const session = await this.repository.findUnique(id, {
        messages: includeMessages
          ? {
              orderBy: { createdAt: 'asc' },
              include: {
                sender: { select: { id: true, fullname: true, avatar: true } },
              },
            }
          : false,
      });

      if (!session) {
        res.pushError({
          key: 'id',
          value: `Không tìm thấy phiên làm việc ID: ${id}`,
        });
        return res;
      }

      res.session = this.mapToSessionDto(session);
      // Gán messages vào response nếu có (ép kiểu any vì SessionDto không có messages)
      if (includeMessages) (res as any).messages = (session as any).messages;
    } catch (error) {
      res.pushError({ key: 'get', value: 'Lỗi khi lấy dữ liệu phiên' });
    }
    return res;
  }

  // 4. GET MANY SESSIONS (Cập nhật bộ lọc)
  async getSessions(query: QuerySessionDto): Promise<ResponseSessionDto> {
    const res = new ResponseSessionDto();
    try {
      const { page, limit, includeMessages, userId, isEnded } = query;
      const skip = (page - 1) * limit;

      // Xây dựng điều kiện lọc (Where clause)
      const where: Prisma.ClientSessionWhereInput = {};

      if (userId) {
        where.userId = userId;
      }
      // Kiểm tra undefined vì isEnded là boolean (có thể false)
      if (isEnded !== undefined) {
        where.isEnded = isEnded;
      }

      const [data, total] = await Promise.all([
        this.repository.findMany({
          skip,
          take: limit,
          where, // <--- Truyền bộ lọc vào
          orderBy: { updatedAt: 'desc' },
          include: {
            messages: includeMessages
              ? { take: 1, orderBy: { createdAt: 'desc' } } // Lấy tin nhắn cuối cùng để preview
              : false,
          },
        }),
        this.repository.count(where),
      ]);

      (res as any).sessions = data.map((item) => this.mapToSessionDto(item));
      res.total = total;
      res.page = page;
      res.limit = limit;
    } catch (error) {
      console.error(error);
      res.pushError({ key: 'list', value: 'Lỗi khi lấy danh sách phiên' });
    }
    return res;
  }

  // 5. LINK USER
  async linkUserToSession(
    sessionId: number,
    userId: number,
  ): Promise<ResponseSessionDto> {
    const res = new ResponseSessionDto();
    try {
      const session = await this.repository.findUnique(sessionId);
      if (!session) {
        res.pushError({ key: 'id', value: 'Không tìm thấy phiên' });
        return res;
      }

      // Check xung đột: Nếu phiên đã có chủ mà không phải là user hiện tại
      if (session.userId && session.userId !== userId) {
        // Trả về lỗi 400 để Client biết đường reload tạo phiên mới
        res.pushError({
          key: 'userId',
          value: 'Phiên này đã thuộc về người dùng khác',
        });
        return res;
      }

      // Gọi repository để update
      const updated = await this.repository.linkUserToSession(
        sessionId,
        userId,
      );
      res.session = this.mapToSessionDto(updated);
    } catch (error) {
      res.pushError({ key: 'link', value: 'Lỗi khi liên kết người dùng' });
    }
    return res;
  }

  // 6. [NEW] UPDATE BOOKING STATE (Dùng cho ChatGateway)
  async updateBookingState(
    sessionId: number,
    newState: any,
  ): Promise<ResponseSessionDto> {
    const res = new ResponseSessionDto();
    try {
      const session = await this.repository.findUnique(sessionId);
      if (!session) {
        res.pushError({ key: 'id', value: 'Phiên không tồn tại' });
        return res;
      }

      const updated = await this.repository.updateBookingState(
        sessionId,
        newState,
      );
      res.session = this.mapToSessionDto(updated);
    } catch (error) {
      console.error(error);
      res.pushError({
        key: 'update',
        value: 'Lỗi cập nhật trạng thái đặt lịch',
      });
    }
    return res;
  }

  // 7. SET AI STATUS
  async setAiStatus(id: number, enable: boolean): Promise<ResponseSessionDto> {
    const res = new ResponseSessionDto();
    try {
      const session = await this.repository.findUnique(id);
      if (!session) {
        res.pushError({ key: 'id', value: 'Phiên không tồn tại' });
        return res;
      }
      if (session.isEnded) {
        res.pushError({
          key: 'status',
          value: 'Không thể thay đổi trạng thái phiên đã kết thúc',
        });
        return res;
      }

      const updated = await this.repository.update(id, { AIEnable: enable });
      res.session = this.mapToSessionDto(updated);
    } catch (error) {
      res.pushError({ key: 'update', value: 'Lỗi cập nhật trạng thái AI' });
    }
    return res;
  }

  // 8. END SESSION
  async endSession(id: number): Promise<ResponseSessionDto> {
    const res = new ResponseSessionDto();
    try {
      const session = await this.repository.findUnique(id);
      if (!session) {
        res.pushError({ key: 'id', value: 'Phiên không tồn tại' });
        return res;
      }

      const updated = await this.repository.update(id, {
        isEnded: true,
        AIEnable: false,
      });
      res.session = this.mapToSessionDto(updated);
    } catch (error) {
      res.pushError({ key: 'end', value: 'Lỗi khi kết thúc phiên' });
    }
    return res;
  }

  // 9. DELETE SESSION
  async deleteSession(id: number): Promise<ResponseSessionDto> {
    const res = new ResponseSessionDto();
    try {
      const session = await this.repository.findUnique(id);
      if (!session) {
        res.pushError({ key: 'id', value: 'Không tìm thấy phiên' });
        return res;
      }
      await this.repository.delete(id);
      res.session = this.mapToSessionDto(session);
    } catch (error) {
      res.pushError({ key: 'delete', value: 'Lỗi khi xóa phiên' });
    }
    return res;
  }
}
