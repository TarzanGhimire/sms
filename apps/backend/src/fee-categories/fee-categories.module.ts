import { Module } from '@nestjs/common';
import { FeeCategoriesService } from './fee-categories.service';
import { FeeCategoriesController } from './fee-categories.controller';

@Module({
  controllers: [FeeCategoriesController],
  providers: [FeeCategoriesService],
  exports: [FeeCategoriesService],
})
export class FeeCategoriesModule {}
