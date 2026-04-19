import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module'; // Giả sử bạn có module này chứa PrismaService
import { ClassesController } from './classes.controller';
import { ClassesService } from './class.service';
import { ClassRepository } from './class.repository';

@Module({
  imports: [PrismaModule],
  controllers: [ClassesController],
  providers: [ClassesService, ClassRepository],
  exports: [ClassesService],
})
export class ClassesModule {}