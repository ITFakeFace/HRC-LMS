import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  
  engine: "classic",
  datasource: {
    url: "mysql://root:DoThanhHung66%404@localhost:3306/KLTN_HRC_JS",
  },
});
