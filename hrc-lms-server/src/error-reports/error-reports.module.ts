import { Module } from '@nestjs/common';
import { ErrorReportsService } from './error-reports.service';
import { ErrorReportsController } from './error-reports.controller';
import { ErrorReportsRepository } from './error-reports.repository';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [ErrorReportsController],
  providers: [ErrorReportsService, ErrorReportsRepository],
  exports: [ErrorReportsService],
})
export class ErrorReportsModule {}