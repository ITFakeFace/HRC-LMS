// src/consultation-booking/consultation-booking.service.ts

import { Injectable } from '@nestjs/common';
import { ConsultationBookingRepository } from './consultation-booking.repository';
import { CreateConsultationBookingDto } from './dto/create-consultation-booking.dto';
import { UpdateConsultationBookingDto } from './dto/update-consultation-booking.dto';
import { ConsultationBookingDto } from './dto/consultation-booking.dto';
import { ResponseConsultationBookingDto } from './dto/response-consultation-booking.dto';
import { ConsultationBooking, Prisma } from '@prisma/client';
import { BookingStatus } from './dto/booking-status.enum';

@Injectable()
export class ConsultationBookingService {
  constructor(
    private readonly bookingRepository: ConsultationBookingRepository,
  ) {}

  // === 1. CREATE ===
  async create(
    createDto: CreateConsultationBookingDto,
  ): Promise<ResponseConsultationBookingDto> {
    const res = new ResponseConsultationBookingDto();

    // Convert string time sang Date object để xử lý
    const bookingTime = new Date(createDto.time);

    // 1. Validate: Kiểm tra xem khung giờ này đã có người đặt chưa (trừ các đơn đã hủy)
    const existingBooking =
      await this.bookingRepository.findByTime(bookingTime);

    if (existingBooking) {
      res.pushError({
        key: 'time',
        value: 'Khung giờ này đã có lịch hẹn khác. Vui lòng chọn giờ khác.',
      });
    }

    // Nếu có lỗi validation -> Dừng và trả về ngay
    if (res.hasErrors()) {
      return res;
    }

    // 2. Thực thi tạo mới
    try {
      // Mapping DTO sang Prisma Input
      const data: Prisma.ConsultationBookingCreateInput = {
        fullname: createDto.fullname,
        phone: createDto.phone,
        email: createDto.email,
        method: createDto.method,
        time: bookingTime,
        destination: createDto.destination,
        status: BookingStatus.PENDING, // Mặc định là PENDING khi tạo mới
      };

      const newBooking = await this.bookingRepository.create(data);
      res.booking = this.mapToDto(newBooking);
    } catch (error) {
      console.error('Lỗi khi tạo lịch hẹn:', error);
      res.pushError({
        key: 'global',
        value: 'Lỗi không mong muốn trong quá trình tạo lịch hẹn.',
      });
    }

    return res;
  }

  // === 2. FIND ALL ===
  // Hỗ trợ truyền tham số phân trang/lọc vào (tận dụng sức mạnh của Repository)
  async findAll(params?: {
    skip?: number;
    take?: number;
    where?: Prisma.ConsultationBookingWhereInput;
    orderBy?: Prisma.ConsultationBookingOrderByWithRelationInput;
  }): Promise<ConsultationBookingDto[]> {
    const bookings = await this.bookingRepository.findMany(params || {});
    return bookings.map((booking) => this.mapToDto(booking));
  }

  // === 3. FIND ONE ===
  async findOne(id: number): Promise<ResponseConsultationBookingDto> {
    const res = new ResponseConsultationBookingDto();

    const booking = await this.bookingRepository.findUnique(id);

    if (!booking) {
      res.pushError({
        key: 'id',
        value: `Lịch hẹn với ID ${id} không tồn tại.`,
      });
      return res;
    }

    res.booking = this.mapToDto(booking);
    return res;
  }

  // === 4. UPDATE ===
  async update(
    id: number,
    updateDto: UpdateConsultationBookingDto,
  ): Promise<ResponseConsultationBookingDto> {
    const res = new ResponseConsultationBookingDto();

    // 1. Kiểm tra tồn tại
    const existingBooking = await this.bookingRepository.findUnique(id);
    if (!existingBooking) {
      res.pushError({
        key: 'id',
        value: `Lịch hẹn với ID ${id} không tồn tại.`,
      });
      return res; // Dừng ngay nếu không tìm thấy ID
    }

    // 2. Validate logic: Kiểm tra trùng giờ nếu có thay đổi thời gian
    if (updateDto.time) {
      const newTime = new Date(updateDto.time);
      const duplicateCheck = await this.bookingRepository.findByTime(newTime);

      // Nếu tìm thấy lịch trùng VÀ ID của cái tìm thấy khác với ID đang sửa
      if (duplicateCheck && duplicateCheck.id !== id) {
        res.pushError({
          key: 'time',
          value: 'Thời gian cập nhật bị trùng với một lịch hẹn khác.',
        });
      }
    }

    if (res.hasErrors()) {
      return res;
    }

    // 3. Thực thi update
    try {
      // Chuẩn bị data update (Prisma tự bỏ qua undefined)
      const updateData: Prisma.ConsultationBookingUpdateInput = {
        ...updateDto,
        time: updateDto.time ? new Date(updateDto.time) : undefined,
      };

      const updatedBooking = await this.bookingRepository.update(
        id,
        updateData,
      );
      res.booking = this.mapToDto(updatedBooking);
    } catch (error) {
      console.error('Lỗi khi cập nhật lịch hẹn:', error);
      res.pushError({
        key: 'global',
        value: 'Lỗi không mong muốn trong quá trình cập nhật lịch hẹn.',
      });
    }

    return res;
  }

  // === 5. REMOVE ===
  async remove(id: number): Promise<ResponseConsultationBookingDto> {
    const res = new ResponseConsultationBookingDto();

    // 1. Kiểm tra tồn tại
    const existingBooking = await this.bookingRepository.findUnique(id);
    if (!existingBooking) {
      res.pushError({
        key: 'id',
        value: `Lịch hẹn với ID ${id} không tồn tại.`,
      });
      return res;
    }

    // 2. Thực thi xóa
    try {
      const deletedBooking = await this.bookingRepository.delete(id);
      res.booking = this.mapToDto(deletedBooking);
    } catch (error) {
      console.error('Lỗi khi xóa lịch hẹn:', error);
      res.pushError({
        key: 'global',
        value: 'Không thể xóa lịch hẹn này (có thể do lỗi hệ thống).',
      });
    }

    return res;
  }

  // === Helper Map ===
  // Chuyển từ Prisma Entity (DB) sang DTO (Response)
  // Cần ép kiểu BookingStatus từ string của DB sang Enum nếu cần thiết, hoặc Prisma đã tự lo
  private mapToDto(booking: ConsultationBooking): ConsultationBookingDto {
    return {
      id: booking.id,
      fullname: booking.fullname,
      phone: booking.phone,
      email: booking.email,
      method: booking.method,
      time: booking.time,
      destination: booking.destination,
      // Ép kiểu về Enum để đảm bảo type safety
      status: booking.status as BookingStatus,
      adminNotes: booking.adminNotes,
      createdAt: booking.createdAt,
      updatedAt: booking.updatedAt,
    };
  }
}
