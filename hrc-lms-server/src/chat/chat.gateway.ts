import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  WebSocketServer,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  WsException,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import ms, { StringValue } from 'ms';

// SERVICES
import { SessionService } from '../session/session.service';
import { ChatContentService } from '../chat-content/chat-content.service';
import { AiService } from '../ai/ai.service';
import { PrismaService } from 'src/prisma/prisma.service';
// 1. IMPORT SERVICE ĐẶT LỊCH
import { ConsultationBookingService } from '../consultation-booking/consultation-booking.service';

// UTILS & DTOs
import { CreateChatContentDto } from '../chat-content/dto/create-chat-content.dto';
import { ResponseFormatter } from 'src/utils/response-formater.util';
// 2. IMPORT DTO ĐẶT LỊCH
import { CreateConsultationBookingDto } from '../consultation-booking/dto/create-consultation-booking.dto';

interface EnrichedCourseData {
  courseCode: string;
  courseName: string;
  field: string | null;
  value: any;
}

@WebSocketGateway(8080, {
  cors: { origin: '*' },
})
export class ChatGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer() server: Server;
  private disconnectTimers: Map<number, NodeJS.Timeout> = new Map();
  private readonly RECONNECT_GRACE_PERIOD = ms(
    (process.env.WS_RECONNECT_TIMEOUT as StringValue) || '1m',
  );

  constructor(
    private readonly chatContentService: ChatContentService,
    private readonly sessionService: SessionService,
    private readonly aiService: AiService,
    private readonly prisma: PrismaService,
    private readonly responseFormatter: ResponseFormatter,
    // 3. INJECT BOOKING SERVICE
    private readonly bookingService: ConsultationBookingService,
  ) {}

  afterInit(server: Server) {
    console.log('🚀 WebSocket Gateway Initialized');
  }

  // --- 1. HANDLE CONNECTION ---
  async handleConnection(client: Socket) {
    const query = client.handshake.query;

    if (query.role === 'admin') {
      await client.join('admin_room');
      console.log(`🛡️ Admin ${client.id} joined admin_room`);
      return;
    }

    const sessionIdRaw = query.sessionId;
    if (!sessionIdRaw) {
      client.emit('exception', { message: 'Thiếu Session ID' });
      client.disconnect();
      return;
    }

    const sessionId = Number(sessionIdRaw);
    if (this.disconnectTimers.has(sessionId)) {
      clearTimeout(this.disconnectTimers.get(sessionId));
      this.disconnectTimers.delete(sessionId);
    }

    const roomName = `session_${sessionId}`;
    await client.join(roomName);
    console.log(`👤 Client ${client.id} joined ${roomName}`);
  }

  // --- 2. HANDLE DISCONNECT ---
  handleDisconnect(client: Socket) {
    const query = client.handshake.query;
    if (query.role === 'admin') return;

    const sessionId = Number(query.sessionId);
    if (!sessionId) return;

    const timer = setTimeout(async () => {
      try {
        await this.sessionService.endSession(sessionId);
        this.disconnectTimers.delete(sessionId);
        this.server.to('admin_room').emit('session_ended', { sessionId });
      } catch (error) {
        console.error(`Error auto-ending session ${sessionId}`, error);
      }
    }, this.RECONNECT_GRACE_PERIOD);

    this.disconnectTimers.set(sessionId, timer);
  }

  // --- 3. HANDLE MESSAGES ---
  @SubscribeMessage('send_message')
  async handleUserMessage(
    @MessageBody() payload: CreateChatContentDto,
    @ConnectedSocket() client: Socket,
  ): Promise<void> {
    try {
      const savedMsg = await this.chatContentService.create(payload);

      console.log('---------------------------------');
      console.log('📨 Gateway nhận tin nhắn:', payload.message);
      console.log('---------------------------------');

      this.server
        .to(`session_${payload.sessionId}`)
        .emit('receive_message', savedMsg);
      this.server
        .to('admin_room')
        .emit('admin_new_message_notification', savedMsg);

      this.handleAiResponse(
        payload.sessionId,
        payload.message,
        payload.forcedIntent,
      );
    } catch (error) {
      console.error('❌ Lỗi khi lưu tin nhắn user:', error);
      this.sendErrorToClient(
        payload.sessionId,
        'Không thể gửi tin nhắn. Lỗi hệ thống.',
      );
    }
  }

  @SubscribeMessage('admin_send_message')
  async handleAdminMessage(
    @MessageBody() payload: CreateChatContentDto,
    @ConnectedSocket() client: Socket,
  ): Promise<void> {
    if (client.handshake.query.role !== 'admin') return;

    try {
      await this.sessionService.setAiStatus(payload.sessionId, false);

      const savedMsg = await this.chatContentService.create({
        ...payload,
        senderId: 999,
      });

      this.server
        .to(`session_${payload.sessionId}`)
        .emit('receive_message', savedMsg);
      client.emit('receive_message', savedMsg);
    } catch (error) {
      client.emit('exception', { message: 'Admin gửi tin thất bại' });
    }
  }

  // --- 4. CORE AI LOGIC ---
  async handleAiResponse(
    sessionId: number,
    userMessage: string,
    clientForcedIntent?: 'tư vấn' | 'đặt lịch',
  ) {
    try {
      const sessionData = await this.sessionService.getSession(sessionId);
      const session = sessionData.session;

      this.sendBotStatus(sessionId, 'Đang suy nghĩ...');

      if (session && session.AIEnable && !session.isEnded) {
        const currentBookingState = (session as any).bookingState || null;
        let finalIntent = clientForcedIntent;

        if (!finalIntent) {
          if (
            currentBookingState &&
            this.isBookingIncomplete(currentBookingState)
          ) {
            finalIntent = 'đặt lịch';
          }
        }

        console.log(`\n🟢 [START AI SESSION ${sessionId}]`);

        const aiRes = await this.aiService.ask(
          userMessage,
          currentBookingState,
          finalIntent,
        );

        this.sendBotStatus(sessionId, 'Đang soạn tin...');
        console.log(`🤖 AI Response:`, JSON.stringify(aiRes, null, 2));

        let replyText = '';

        // --- XỬ LÝ PHẢN HỒI ---

        if (aiRes.target === 'đặt lịch') {
          const newState = aiRes.data;

          // Cập nhật trạng thái tạm thời vào Session
          await this.sessionService.updateBookingState(sessionId, newState);

          // 4. KIỂM TRA: Nếu đã đủ thông tin -> Lưu xuống DB
          if (!this.isBookingIncomplete(newState)) {
            console.log('📝 Thông tin đặt lịch đã đủ, tiến hành lưu DB...');

            // Map dữ liệu từ AI State sang DTO
            const bookingDto: CreateConsultationBookingDto = {
              fullname: newState.fullname,
              // Ưu tiên lấy phone, nếu không có thì null (Service sẽ validate)
              phone: newState.phone || undefined,
              email: newState.email || undefined,
              method: newState.method,
              time: newState.time, // Giả sử AI trả về ISO String chuẩn
              destination: newState.destination,
            };

            // Gọi Service để tạo booking
            const bookingResult = await this.bookingService.create(bookingDto);

            if (bookingResult.hasErrors()) {
              // Xử lý lỗi từ Service trả về (VD: Trùng giờ)
              const errorMsg =
                bookingResult.errors[0]?.value || 'Lỗi không xác định';
              console.warn('⚠️ Lưu booking thất bại:', errorMsg);

              replyText = `Xin lỗi, tôi không thể đặt lịch vào giờ này: ${errorMsg}. Bạn vui lòng chọn thời gian khác nhé.`;

              // Reset trường time trong state để user nhập lại
              const stateWithoutTime = { ...newState, time: null };
              await this.sessionService.updateBookingState(
                sessionId,
                stateWithoutTime,
              );
            } else {
              // THÀNH CÔNG
              console.log(
                '✅ Lưu booking thành công:',
                bookingResult.booking?.id,
              );

              const formattedTime = bookingResult.booking
                ? new Date(bookingResult.booking.time).toLocaleString('vi-VN', {
                    hour12: false,
                  })
                : newState.time;

              const finalState = {
                ...newState,
                id: bookingResult.booking?.id, // Inject ID vào state
                time: formattedTime, // Inject Time đẹp vào state
              };

              replyText =
                this.responseFormatter.formatBookingQuestion(finalState);

              // Clear booking state trong session để tránh lặp lại vòng lặp đặt lịch
              await this.sessionService.updateBookingState(sessionId, null);
            }
          } else {
            // Nếu chưa đủ thông tin -> Tiếp tục hỏi
            replyText = this.responseFormatter.formatBookingQuestion(newState);
          }
        } else if (aiRes.target === 'tư vấn') {
          const enrichedData = await this.enrichCourseData(aiRes.data);
          replyText =
            this.responseFormatter.formatConsultationResponse(enrichedData);
        } else {
          replyText =
            'Xin lỗi, tôi chưa hiểu ý bạn. Bạn muốn hỏi về khóa học hay đặt lịch tư vấn?';
        }

        if (replyText) {
          await this.sendBotMessage(sessionId, replyText);
        }
      }
    } catch (error) {
      console.error('❌ Lỗi xử lý AI:', error);
      this.sendErrorToClient(
        sessionId,
        'Hệ thống AI đang bận hoặc gặp sự cố. Vui lòng thử lại sau.',
      );
    }
  }

  // --- HELPER FUNCTIONS ---

  private sendErrorToClient(sessionId: number, message: string) {
    this.server.to(`session_${sessionId}`).emit('exception', {
      status: 'error',
      message: message,
    });
  }

  private async sendBotMessage(sessionId: number, message: string) {
    const BOT_ID = -1;
    const botMsg = await this.chatContentService.create({
      sessionId,
      message,
      senderId: BOT_ID,
    });

    this.server.to(`session_${sessionId}`).emit('receive_message', botMsg);
    this.server.to('admin_room').emit('admin_new_message_notification', botMsg);
  }

  private isBookingIncomplete(state: any): boolean {
    if (!state) return true;
    if (!state.fullname) return true;
    // Cần ít nhất Email HOẶC Phone
    const hasContact = !!state.email || !!state.phone;
    if (!hasContact) return true;
    if (!state.time) return true;
    if (!state.method) return true;
    if (!state.destination) return true;
    return false;
  }

  async enrichCourseData(rawIntents: any[]): Promise<EnrichedCourseData[]> {
    try {
      if (
        !rawIntents ||
        rawIntents.length === 0 ||
        (rawIntents.length === 1 && !rawIntents[0].course)
      ) {
        return [];
      }

      const templates = this.responseFormatter.getAllVariants();
      const template = templates.consultation
        ? templates.consultation[0]
        : null;
      const map = template?.intent_map || {};

      const courseCodes = [
        ...new Set(rawIntents.map((i) => i.course).filter((c) => c)),
      ];

      const coursesDB = await this.prisma.course.findMany({
        where: {
          code: { in: courseCodes as string[] },
        },
      });

      const enrichedData: EnrichedCourseData[] = [];

      for (const intent of rawIntents) {
        const course = coursesDB.find((c) => c.code === intent.course);

        if (!course) continue;

        if (intent.target) {
          const targetKey = intent.target.toLowerCase();
          const dbField = map[targetKey];

          if (dbField && (course as any)[dbField] !== undefined) {
            enrichedData.push({
              courseCode: course.code,
              courseName: course.name,
              field: dbField,
              value: (course as any)[dbField],
            });
          }
        } else {
          enrichedData.push({
            courseCode: course.code,
            courseName: course.name,
            field: null,
            value: null,
          });
        }
      }
      return enrichedData;
    } catch (e) {
      console.error('Lỗi Enrich Data:', e);
      throw new Error('Lỗi truy vấn dữ liệu khóa học');
    }
  }

  private sendBotStatus(sessionId: number, text: string) {
    this.server.to(`session_${sessionId}`).emit('bot_status', {
      isTyping: true,
      message: text,
    });
  }
}
