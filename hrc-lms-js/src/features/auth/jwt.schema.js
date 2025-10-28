// schemas/Jwt.schema.js
import {z} from 'zod';

const JwtPayloadSchema = z.object({
    sub: z.string(), // UserId dạng chuỗi
    roles: z.array(z.string()),
    permissions: z.array(z.string()),
    jti: z.string(), // JWT ID
    iat: z.number(), // Issued At
    exp: z.number(), // Expiration Time
});

export default JwtPayloadSchema;