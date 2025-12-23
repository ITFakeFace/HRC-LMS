// src/image/multer.config.ts
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { v4 as uuidv4 } from 'uuid';
import { HttpException, HttpStatus } from '@nestjs/common';
import * as fs from 'fs';

// Hàm tạo option động dựa trên folder name
export const createMulterOptions = (folder: string) => {
  return {
    limits: {
      fileSize: 10 * 1024 * 1024, // Giới hạn 10MB (tùy chỉnh số này)
    },
    fileFilter: (req: any, file: any, cb: any) => {
      if (file.mimetype.match(/\/(jpg|jpeg|png|gif)$/)) {
        cb(null, true);
      } else {
        cb(new HttpException(`Unsupported file type ${extname(file.originalname)}`, HttpStatus.BAD_REQUEST), false);
      }
    },
    storage: diskStorage({
      // Xử lý nơi lưu trữ động
      destination: (req: any, file: any, cb: any) => {
        // Tạo đường dẫn: ./public/images/users hoặc ./public/images/courses
        const uploadPath = join(process.cwd(), 'public', 'images', folder);

        // Kiểm tra nếu thư mục chưa tồn tại thì tạo mới (đệ quy)
        if (!fs.existsSync(uploadPath)) {
          fs.mkdirSync(uploadPath, { recursive: true });
        }

        cb(null, uploadPath);
      },
      filename: (req: any, file: any, cb: any) => {
        const fileName = `${uuidv4()}${extname(file.originalname)}`;
        cb(null, fileName);
      },
    }),
  };
};