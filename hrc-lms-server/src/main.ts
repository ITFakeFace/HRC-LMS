import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { CustomValidationPipe } from './common/pipes/custom-validation.pipes';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  // BẬT CORS
  // Cấu hình Validation Pipe Global
  // Áp dụng Pipe vừa tạo
  app.useGlobalPipes(new CustomValidationPipe());

  app.enableCors({
    origin: 'http://localhost:3001', // Chỉ cho phép Frontend này
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true, // Quan trọng: Cho phép gửi Cookies/Token
  });
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
