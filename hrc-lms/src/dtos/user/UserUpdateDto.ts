// models/dto/UserUpdateDto.ts
export interface UserUpdateDto {
    pID: string;             // required
    username: string;        // required
    email: string;           // required
    password: string;        // required
    fullname: string;        // required
    gender: boolean;         // required
    dob: Date;               // required
    phone?: string | null;   // optional
    avatar?: Buffer | null;  // optional
}
