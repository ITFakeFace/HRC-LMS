// src/image/image.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import * as fs from 'fs';
// Lưu ý: Nếu IDE báo lỗi import fs, hãy dùng: import * as fs from 'fs';

@Injectable()
export class ImageService {
  
  // Thêm tham số folder vào hàm
  async saveImageInfo(filename: string, folder: string) {
    // Đường dẫn trả về cho Client sẽ bao gồm tên folder
    // Ví dụ: /public/images/users/abc.jpg
    const imageUrl = `/public/images/${folder}/${filename}`;

    return {
      imageUrl: imageUrl,
      filename: filename,
      folder: folder
    };
  }
}