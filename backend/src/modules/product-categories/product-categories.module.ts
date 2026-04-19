import { Module } from '@nestjs/common';
import { ProductCategoriesController } from './product-categories.controller';
import { ProductCategoriesService } from './product-categories.service';
import { ProductCategoriesRepository } from './repositories/product-categories.repository';

@Module({
  controllers: [ProductCategoriesController],
  providers: [ProductCategoriesService, ProductCategoriesRepository],
  exports: [ProductCategoriesService],
})
export class ProductCategoriesModule {}
