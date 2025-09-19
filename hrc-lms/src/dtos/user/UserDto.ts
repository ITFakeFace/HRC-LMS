export interface UserDto {
    id: number;               // AUTO_INCREMENT, Primary Key
    pID: string;              // VARCHAR(12), unique personal ID
    username: string;         // VARCHAR(50), unique
    phone?: string | null;    // VARCHAR(10), unique, có thể null
    email: string;            // VARCHAR(100), unique
    password: string;         // hashed password
    avatar: Buffer;           // BLOB -> Buffer trong Node.js
    fullname: string;         // VARCHAR(100)
    gender: boolean;          // BIT -> boolean
    dob: Date;                // DATETIME
    lockoutEnd?: Date | null; // DATETIME, có thể null
    isEmailVerified: boolean;
}