export interface Role {
    id: number;           // AUTO_INCREMENT, PK
    fullname: string;     // VARCHAR(50), unique
    shortname: string;    // VARCHAR(15), unique
}