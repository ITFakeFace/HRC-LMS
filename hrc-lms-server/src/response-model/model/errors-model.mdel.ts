import { ResponseError } from './response-model.model';

export class ErrorsModel {
  errors: ResponseError[] = [];

  pushError(errorInfo: { key: string; value: string }): void {
    // 1. Tìm lỗi hiện có theo key
    let existingError = this.errors.find((err) => err.key === errorInfo.key);

    // 2. Nếu chưa tồn tại, tạo mới đối tượng ResponseError
    if (!existingError) {
      // Khởi tạo đối tượng mới đúng cấu trúc ResponseError
      existingError = {
        key: errorInfo.key,
        value: [], // Khởi tạo mảng rỗng
      };
      this.errors.push(existingError);
    }

    // 3. Thêm thông báo lỗi vào mảng value
    existingError.value.push(errorInfo.value);
  }

  popError(key: string, value: string): void {
    // 1. Tìm vị trí (index) của lỗi theo key
    const index = this.errors.findIndex((err) => err.key === key);

    // Nếu không tìm thấy key thì dừng luôn
    if (index === -1) return;

    const existingError = this.errors[index];

    // 2. Lọc bỏ value cần xóa ra khỏi mảng value
    // (Giữ lại những cái KHÁC value cần xóa)
    existingError.value = existingError.value.filter((msg) => msg !== value);

    // 3. Nếu mảng value rỗng sau khi xóa -> Xóa luôn cả object lỗi khỏi danh sách errors
    if (existingError.value.length === 0) {
      this.errors.splice(index, 1);
    }
  }
  
  hasErrors(): boolean {
    return this.errors.length > 0;
  }
}
