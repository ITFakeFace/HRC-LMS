// Đây là DTO dùng cho RESPONSE hoặc khi bạn đã có ID (Response DTO)
export interface UserResponseDto {
    id: number;               // Primary Key (Đã có sau khi tạo)
    pID: string;
    username: string;
    phone: string | null;
    email: string;
    password: string;         // Hashed password (Nên loại bỏ trong Response thực tế)
    avatar: Buffer | null;
    fullname: string;
    gender: boolean;
    dob: Date;
    lockoutEnd: Date | null;
    isEmailVerified: boolean;
    createdAt: Date;         // Thêm cả hai trường DateTime cho Response
    updatedAt: Date;
}

// Nếu bạn chỉ dùng UserDto cho Response, hãy bỏ các trường nhạy cảm/lớn:
// export type UserDto = Omit<UserResponseDto, 'password' | 'avatar'>;