import * as dotenv from 'dotenv'; // Import toàn bộ thư viện dưới tên 'dotenv'
import { join } from 'path';
import { defineConfig, env } from 'prisma/config';

// Gọi trực tiếp hàm .config()
dotenv.config({ path: join(process.cwd(), '.env') });

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },

  engine: 'classic',
  datasource: {
    url: process.env.DATABASE_URL || env('DATABASE_URL'),
  },
});
