import {
  ValidationPipe,
  ValidationError,
  BadRequestException,
  Injectable,
} from '@nestjs/common';

// Interface định nghĩa cấu trúc trả về (để đảm bảo type-safe)
interface ResponseError {
  key: string;
  value: string[]; // Mảng chuỗi lỗi
}

@Injectable()
export class CustomValidationPipe extends ValidationPipe {
  constructor() {
    super({
      whitelist: true, // Tự động loại bỏ field thừa
      transform: true, // Tự động convert type

      // 🔥 LOGIC TÙY CHỈNH Ở ĐÂY
      exceptionFactory: (validationErrors: ValidationError[] = []) => {
        // Map từ ValidationError của class-validator sang ResponseError của bạn
        const formattedErrors: ResponseError[] = validationErrors.map(
          (error) => {
            // error.constraints là object dạng: { isEmail: "Email sai", minLength: "Ngắn quá" }
            // Object.values sẽ lấy ra: ["Email sai", "Ngắn quá"] -> Đúng chuẩn string[] bạn cần
            const messages = error.constraints
              ? Object.values(error.constraints)
              : ['Lỗi không xác định'];

            return {
              key: error.property, // Tên field (ví dụ: "email")
              value: messages, // Mảng các thông báo lỗi
            };
          },
        );

        // Trả về đúng cấu trúc ResponseModel
        return new BadRequestException({
          status: false,
          statusCode: 400,
          message: 'Dữ liệu đầu vào không hợp lệ',
          errors: formattedErrors, // Mảng ResponseError[]
          data: null,
        });
      },
    });
  }
}
