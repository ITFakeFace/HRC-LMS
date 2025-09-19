export interface Permission {
    id: number;             // AUTO_INCREMENT, PK
    name: string;           // VARCHAR(100), unique
    description?: string;   // VARCHAR(255), optional
}