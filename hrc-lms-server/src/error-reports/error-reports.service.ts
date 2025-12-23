import { Injectable } from '@nestjs/common';
import { ErrorReportsRepository } from './error-reports.repository';
import { CreateErrorReportDto } from './dto/create-error-report.dto';
import { UpdateErrorReportDto } from './dto/update-error-report.dto';
import { ErrorReportDto } from './dto/error-report.dto';
import { ResponseErrorReportDto } from './dto/response-error-report.dto';
import { plainToInstance } from 'class-transformer';
import { Prisma, RequestStatus } from '@prisma/client';

@Injectable()
export class ErrorReportsService {
  constructor(private readonly repo: ErrorReportsRepository) {}

  // === 1. CREATE ===
  async create(userId: number, createDto: CreateErrorReportDto): Promise<ResponseErrorReportDto> {
    const res = new ResponseErrorReportDto();

    // (Optional) Logic chặn spam: Kiểm tra xem user có vừa báo lỗi tương tự không
    // const similar = await this.repo.findSimilarReports(createDto.title);
    // if (similar.length > 0) { ... }

    try {
      const newReport = await this.repo.create({
        title: createDto.title,
        content: createDto.content,
        image: createDto.image,
        user: { connect: { id: userId } },
      });

      res.errorReport = plainToInstance(ErrorReportDto, newReport, { excludeExtraneousValues: true });
    } catch (error) {
      console.error('Create ErrorReport Error:', error);
      res.pushError({ key: 'global', value: 'Lỗi hệ thống khi gửi báo lỗi.' });
    }

    return res;
  }

  // === 2. FIND ALL ===
  async findAll(status?: RequestStatus): Promise<ErrorReportDto[]> {
    const whereCondition: Prisma.ErrorReportWhereInput = {};
    
    if (status) {
        whereCondition.status = status;
    }

    const reports = await this.repo.findAll({
      where: whereCondition,
      orderBy: { createdAt: 'desc' }
    });

    return plainToInstance(ErrorReportDto, reports, { excludeExtraneousValues: true });
  }

  // === 3. FIND ONE ===
  async findOne(id: number): Promise<ResponseErrorReportDto> {
    const res = new ResponseErrorReportDto();
    const report = await this.repo.findById(id);

    if (!report) {
      res.pushError({ key: 'id', value: 'Báo lỗi không tồn tại.' });
      return res;
    }

    res.errorReport = plainToInstance(ErrorReportDto, report, { excludeExtraneousValues: true });
    return res;
  }

  // === 4. UPDATE (Admin phản hồi hoặc cập nhật trạng thái) ===
  async update(id: number, updateDto: UpdateErrorReportDto): Promise<ResponseErrorReportDto> {
    const res = new ResponseErrorReportDto();

    const oldReport = await this.repo.findById(id);
    if (!oldReport) {
      res.pushError({ key: 'id', value: 'Báo lỗi không tồn tại.' });
      return res;
    }

    let resolvedAt = oldReport.resolvedAt;
    // Nếu đổi sang trạng thái đã xong -> cập nhật thời gian
    if (updateDto.status === 'RESOLVED' || updateDto.status === 'REJECTED') {
        resolvedAt = new Date();
    }

    const updateData: Prisma.ErrorReportUpdateInput = {
      ...updateDto,
      resolvedAt: resolvedAt,
    };

    try {
      const updated = await this.repo.update(id, updateData);
      res.errorReport = plainToInstance(ErrorReportDto, updated, { excludeExtraneousValues: true });
    } catch (error) {
      res.pushError({ key: 'global', value: 'Lỗi khi cập nhật báo lỗi.' });
    }

    return res;
  }

  // === 5. DELETE ===
  async remove(id: number): Promise<ResponseErrorReportDto> {
    const res = new ResponseErrorReportDto();
    
    const report = await this.repo.findById(id);
    if (!report) {
      res.pushError({ key: 'id', value: 'Báo lỗi không tồn tại.' });
      return res;
    }

    try {
      await this.repo.delete(id);
      res.errorReport = plainToInstance(ErrorReportDto, report, { excludeExtraneousValues: true });
    } catch (error) {
      res.pushError({ key: 'global', value: 'Không thể xóa báo lỗi này.' });
    }

    return res;
  }
}