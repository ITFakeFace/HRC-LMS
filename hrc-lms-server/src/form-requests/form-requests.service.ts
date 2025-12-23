import { Injectable } from '@nestjs/common';
import { FormRequestsRepository } from './form-requests.repository';
import { CreateFormRequestDto } from './dto/create-form-request.dto';
import { UpdateFormRequestDto } from './dto/update-form-request.dto';
import { FormRequestDto } from './dto/form-request.dto';
import { ResponseFormRequestDto } from './dto/response-form-request.dto';
import { plainToInstance } from 'class-transformer';
import { Prisma, RequestStatus } from '@prisma/client';

@Injectable()
export class FormRequestsService {
  constructor(private readonly repo: FormRequestsRepository) {}

  // === 1. CREATE ===
  async create(userId: number, createDto: CreateFormRequestDto): Promise<ResponseFormRequestDto> {
    const res = new ResponseFormRequestDto();

    try {
      const newRequest = await this.repo.create({
        title: createDto.title,
        content: createDto.content,
        image: createDto.image,
        user: { connect: { id: userId } },
      });

      res.formRequest = plainToInstance(FormRequestDto, newRequest, { excludeExtraneousValues: true });
    } catch (error) {
      console.error('Create FormRequest Error:', error);
      res.pushError({ key: 'global', value: 'Lỗi hệ thống khi tạo yêu cầu.' });
    }

    return res;
  }

  // === 2. FIND ALL (Hỗ trợ lọc cho Admin hoặc User xem của chính mình) ===
  async findAll(userId?: number, status?: RequestStatus): Promise<FormRequestDto[]> {
    // Xây dựng điều kiện lọc
    const whereCondition: Prisma.FormRequestWhereInput = {};
    
    if (userId) {
        whereCondition.userId = userId; // Nếu truyền userId -> Chỉ lấy của user đó
    }
    if (status) {
        whereCondition.status = status; // Lọc theo trạng thái (PENDING, RESOLVED...)
    }

    const requests = await this.repo.findAll({
      where: whereCondition,
      orderBy: { createdAt: 'desc' }
    });

    return plainToInstance(FormRequestDto, requests, { excludeExtraneousValues: true });
  }

  // === 3. FIND ONE ===
  async findOne(id: number): Promise<ResponseFormRequestDto> {
    const res = new ResponseFormRequestDto();
    const request = await this.repo.findById(id);

    if (!request) {
      res.pushError({ key: 'id', value: 'Yêu cầu không tồn tại.' });
      return res;
    }

    res.formRequest = plainToInstance(FormRequestDto, request, { excludeExtraneousValues: true });
    return res;
  }

  // === 4. UPDATE (Dùng cho Admin duyệt hoặc User sửa) ===
  async update(id: number, updateDto: UpdateFormRequestDto): Promise<ResponseFormRequestDto> {
    const res = new ResponseFormRequestDto();

    const oldRequest = await this.repo.findById(id);
    if (!oldRequest) {
      res.pushError({ key: 'id', value: 'Yêu cầu không tồn tại.' });
      return res;
    }

    // Logic: Nếu Admin cập nhật status sang RESOLVED/REJECTED -> Tự động cập nhật ngày giải quyết
    let resolvedAt = oldRequest.resolvedAt;
    if (updateDto.status && updateDto.status !== 'PENDING') {
        resolvedAt = new Date();
    }

    const updateData: Prisma.FormRequestUpdateInput = {
      ...updateDto,
      resolvedAt: resolvedAt,
    };

    try {
      const updated = await this.repo.update(id, updateData);
      res.formRequest = plainToInstance(FormRequestDto, updated, { excludeExtraneousValues: true });
    } catch (error) {
      res.pushError({ key: 'global', value: 'Lỗi khi cập nhật yêu cầu.' });
    }

    return res;
  }

  // === 5. DELETE ===
  async remove(id: number): Promise<ResponseFormRequestDto> {
    const res = new ResponseFormRequestDto();
    
    const request = await this.repo.findById(id);
    if (!request) {
      res.pushError({ key: 'id', value: 'Yêu cầu không tồn tại.' });
      return res;
    }

    try {
      await this.repo.delete(id);
      res.formRequest = plainToInstance(FormRequestDto, request, { excludeExtraneousValues: true });
    } catch (error) {
      res.pushError({ key: 'global', value: 'Không thể xóa yêu cầu này.' });
    }

    return res;
  }
}