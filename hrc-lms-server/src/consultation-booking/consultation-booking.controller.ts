// src/consultation-booking/consultation-booking.controller.ts

import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  UseGuards,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
  Put,
} from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { CreateConsultationBookingDto } from './dto/create-consultation-booking.dto';
import { UpdateConsultationBookingDto } from './dto/update-consultation-booking.dto';
import { ResponseModel } from 'src/response-model/model/response-model.model'; // Import ResponseModel chung
import { ConsultationBookingService } from './consultation-booking.service';

@Controller('consultation-bookings')
@UseGuards(JwtAuthGuard)
export class ConsultationBookingController {
  constructor(private readonly bookingService: ConsultationBookingService) {}

  // 1. CREATE (POST /consultation-bookings)
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body() createDto: CreateConsultationBookingDto,
  ): Promise<ResponseModel> {
    const res = await this.bookingService.create(createDto);

    // Kiểm tra lỗi từ Service (Validate logic: trùng giờ, lỗi hệ thống...)
    if (res.hasErrors()) {
      return new ResponseModel({
        status: false,
        statusCode: HttpStatus.BAD_REQUEST, // 400
        message: 'Validation Failed or Creation Error',
        errors: res.errors,
        data: null,
      });
    }

    // Thành công
    return new ResponseModel({
      status: true,
      statusCode: HttpStatus.CREATED, // 201
      message: 'Consultation booking created successfully',
      data: res.booking,
    });
  }

  // 2. READ ALL (GET /consultation-bookings)
  @Get()
  @HttpCode(HttpStatus.OK)
  async findAll(): Promise<ResponseModel> {
    // Service trả về mảng DTO[]
    const res = await this.bookingService.findAll();

    return new ResponseModel({
      status: true,
      statusCode: HttpStatus.OK, // 200
      message: 'Consultation bookings retrieved successfully',
      data: res,
    });
  }

  // 3. READ ONE (GET /consultation-bookings/:id)
  @Get(':id')
  @HttpCode(HttpStatus.OK)
  async findById(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<ResponseModel> {
    const res = await this.bookingService.findOne(id);

    if (res.hasErrors()) {
      // Nếu lỗi là do ID không tồn tại -> Trả về 404
      if (res.errors.some((err) => err.key === 'id')) {
        return new ResponseModel({
          status: false,
          statusCode: HttpStatus.NOT_FOUND, // 404
          message: `Booking with ID ${id} not found.`,
          errors: res.errors,
          data: null,
        });
      }

      // Các lỗi khác -> Trả về 400
      return new ResponseModel({
        status: false,
        statusCode: HttpStatus.BAD_REQUEST, // 400
        message: 'Error retrieving booking data.',
        errors: res.errors,
        data: null,
      });
    }

    return new ResponseModel({
      status: true,
      statusCode: HttpStatus.OK, // 200
      message: `Booking ID ${id} retrieved successfully`,
      data: res.booking,
    });
  }

  // 4. UPDATE (PUT /consultation-bookings/:id)
  @Put(':id')
  @HttpCode(HttpStatus.OK)
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: UpdateConsultationBookingDto,
  ): Promise<ResponseModel> {
    const res = await this.bookingService.update(id, updateDto);

    if (res.hasErrors()) {
      // Ưu tiên check lỗi 404 (ID không tồn tại)
      if (res.errors.some((err) => err.key === 'id')) {
        return new ResponseModel({
          status: false,
          statusCode: HttpStatus.NOT_FOUND, // 404
          message: `Booking with ID ${id} not found.`,
          errors: res.errors,
          data: null,
        });
      }

      // Các lỗi validation khác (ví dụ: cập nhật giờ bị trùng) -> 400
      return new ResponseModel({
        status: false,
        statusCode: HttpStatus.BAD_REQUEST, // 400
        message: 'Validation Failed or Update Error',
        errors: res.errors,
        data: null,
      });
    }

    // Thành công
    return new ResponseModel({
      status: true,
      statusCode: HttpStatus.OK, // 200
      message: `Booking ID ${id} updated successfully`,
      data: res.booking,
    });
  }

  // 5. DELETE (DELETE /consultation-bookings/:id)
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async remove(@Param('id', ParseIntPipe) id: number): Promise<ResponseModel> {
    const res = await this.bookingService.remove(id);

    if (res.hasErrors()) {
      // Lỗi 404 Not Found
      if (res.errors.some((err) => err.key === 'id')) {
        return new ResponseModel({
          status: false,
          statusCode: HttpStatus.NOT_FOUND, // 404
          message: `Booking with ID ${id} not found.`,
          errors: res.errors,
          data: null,
        });
      }

      // Lỗi khác -> 400
      return new ResponseModel({
        status: false,
        statusCode: HttpStatus.BAD_REQUEST, // 400
        message: 'Cannot delete booking.',
        errors: res.errors,
        data: null,
      });
    }

    // Thành công
    return new ResponseModel({
      status: true,
      statusCode: HttpStatus.OK, // 200
      message: `Booking ID ${id} deleted successfully`,
      data: res.booking, // Trả về thông tin booking đã xóa
    });
  }
}
