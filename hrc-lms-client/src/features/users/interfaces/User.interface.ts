export interface User {
  id: number;
  pID: string;
  username: string;
  phone: string | null; // Có thể là chuỗi (string) hoặc null
  email: string;
  password: string; // Mật khẩu đã được hash
  avatar: string | null; // Có thể là chuỗi URL/path (string) hoặc null
  fullname: string;
  gender: boolean; // Giả sử true là Nam, false là Nữ hoặc ngược lại. Tốt nhất nên dùng 'male' | 'female' hoặc enum.
  dob: string; // Ngày sinh, thường là kiểu Date nhưng ở đây là chuỗi ISO 8601
  lockoutEnd: string | null; // Thời gian khóa tài khoản kết thúc, có thể là chuỗi ISO 8601 hoặc null
  isEmailVerified: boolean; // Trạng thái xác minh email
  createdAt: string; // Thời gian tạo tài khoản, chuỗi ISO 8601
  updatedAt: string; // Thời gian cập nhật gần nhất, chuỗi ISO 8601
}
