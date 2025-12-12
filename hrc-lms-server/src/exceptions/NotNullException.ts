// src/exceptions/BaseException.ts
export class NotNullException extends Error {
    constructor(
        message: string="Properties cannot be null", 
    ) {
        super(message);
    }
}