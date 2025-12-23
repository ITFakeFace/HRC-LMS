// src/image/image.controller.ts
import { 
  Controller, 
  Post, 
  UseInterceptors, 
  UploadedFile,
  Get,
  Param,
  Res
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { createMulterOptions } from './multer.config'; // Import hàm mới
import { ImageService } from './image.service';
import type { Express, Response } from 'express';
import { join } from 'path';

@Controller('upload') // Đổi prefix route cho gọn
export class ImageController {
  constructor(private readonly imageService: ImageService) {}

  // --- API 1: Upload Avatar User (/upload/users) ---
  @Post('users')
  @UseInterceptors(FileInterceptor('file', createMulterOptions('users'))) // Lưu vào folder 'users'
  async uploadUserAvatar(@UploadedFile() file: Express.Multer.File) {
    // Truyền 'users' vào service để tạo URL đúng
    return this.imageService.saveImageInfo(file.filename, 'users');
  }

  // --- API 2: Upload Course Cover (/upload/courses) ---
  @Post('courses')
  @UseInterceptors(FileInterceptor('file', createMulterOptions('courses'))) // Lưu vào folder 'courses'
  async uploadCourseImage(@UploadedFile() file: Express.Multer.File) {
    return this.imageService.saveImageInfo(file.filename, 'courses');
  }

  // --- API 3: Xem ảnh (Hỗ trợ đọc từ subfolder) ---
  // URL gọi: /upload/images/users/ten_file.jpg
  @Get('images/:folder/:filename')
  async serveImage(
    @Param('folder') folder: string, 
    @Param('filename') filename: string, 
    @Res() res: Response
  ) {
    const filePath = join(process.cwd(), 'public', 'images', folder, filename);
    return res.sendFile(filePath);
  }
}