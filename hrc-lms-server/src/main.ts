import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { CustomValidationPipe } from './common/pipes/custom-validation.pipes';
import { NestExpressApplication } from '@nestjs/platform-express'; // 1. Import này
import { json, urlencoded } from 'express'; // 2. Import này

async function bootstrap() {
  // 3. Thêm Generic <NestExpressApplication> để TypeScript hỗ trợ gợi ý code tốt hơn
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // --- BẮT ĐẦU CẤU HÌNH FIX LỖI 413 ---
  // Tăng giới hạn upload lên 50MB (hoặc số khác tùy bạn)
  app.use(json({ limit: '50mb' }));
  app.use(urlencoded({ extended: true, limit: '50mb' }));
  // --- KẾT THÚC CẤU HÌNH FIX LỖI 413 ---

  // Cấu hình Validation Pipe Global
  app.useGlobalPipes(new CustomValidationPipe());

  // BẬT CORS
  app.enableCors({
    origin: 'http://localhost:3001', // Chỉ cho phép Frontend này
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true, // Quan trọng: Cho phép gửi Cookies/Token
  });

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();