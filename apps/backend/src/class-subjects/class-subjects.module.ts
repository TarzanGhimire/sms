import { Module } from '@nestjs/common';
import { ClassSubjectsService } from './class-subjects.service';
import { ClassSubjectsController } from './class-subjects.controller';

@Module({
  controllers: [ClassSubjectsController],
  providers: [ClassSubjectsService],
  exports: [ClassSubjectsService],
})
export class ClassSubjectsModule {}
